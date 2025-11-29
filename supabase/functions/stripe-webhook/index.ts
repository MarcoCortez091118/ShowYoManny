import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    const body = await req.text();

    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  console.info(`Processing webhook event: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await handleSubscriptionChange(event.data.object as Stripe.Subscription);
      break;

    default:
      console.info(`Unhandled event type: ${event.type}`);
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { id, customer, mode, payment_status, amount_total, currency, metadata } = session;

  console.info(`Checkout session completed: ${id}, mode: ${mode}, status: ${payment_status}`);

  await logAudit('webhook_received', session.customer_details?.email, null, 'stripe_session', {
    session_id: id,
    mode,
    payment_status,
    amount_total,
    customer_email: session.customer_details?.email,
  }, true);

  if (!customer || typeof customer !== 'string') {
    console.error('No customer ID in checkout session');
    await logAudit('error', session.customer_details?.email, null, 'stripe_session', {
      session_id: id,
      error: 'No customer ID in checkout session',
    }, false, 'No customer ID in checkout session');
    return;
  }

  if (mode === 'subscription') {
    console.info(`Processing subscription checkout for customer: ${customer}`);
    await syncCustomerFromStripe(customer);
  } else if (mode === 'payment' && payment_status === 'paid') {
    try {
      const { payment_intent } = session;

      const orderData = {
        checkout_session_id: id,
        payment_intent_id: typeof payment_intent === 'string' ? payment_intent : payment_intent?.id,
        customer_id: customer,
        amount_subtotal: session.amount_subtotal || 0,
        amount_total: amount_total || 0,
        currency: currency || 'usd',
        payment_status,
        status: 'completed',
        metadata: {
          ...metadata,
          customer_email: session.customer_details?.email,
          customer_name: session.customer_details?.name,
          customer_phone: session.customer_details?.phone,
        },
      };

      const { error: orderError } = await supabase.from('stripe_orders').insert(orderData);

      if (orderError) {
        console.error('Error inserting order:', orderError);
        await logAudit('error', session.customer_details?.email, null, 'stripe_order', {
          session_id: id,
          error: orderError.message,
        }, false, `Error inserting order: ${orderError.message}`);
        return;
      }

      await logAudit('payment_completed', session.customer_details?.email, null, 'stripe_order', {
        session_id: id,
        amount: amount_total,
        order_id: metadata?.order_id,
      }, true);

      await createOrUpdateCustomer({
        email: session.customer_details?.email || metadata?.user_email,
        name: session.customer_details?.name,
        phone: session.customer_details?.phone,
        stripeCustomerId: customer,
        billingAddress: session.customer_details?.address,
      });

      console.info(`Successfully processed one-time payment for session: ${id}`);

      if (metadata?.order_id) {
        await updatePaymentTracking({
          sessionId: id,
          paymentIntentId: typeof payment_intent === 'string' ? payment_intent : payment_intent?.id,
          customerId: customer,
          customerEmail: session.customer_details?.email || metadata.user_email,
          customerName: session.customer_details?.name,
          amountCents: amount_total || 0,
          planId: metadata.plan_id,
          queueItemId: metadata.order_id,
          paymentReceived: true,
        });

        await activateQueueItemAfterPayment(
          metadata.order_id,
          session.customer_details?.email || metadata.user_email,
          session.customer_details?.name || undefined,
          customer
        );
      } else {
        console.warn('No order_id in metadata - payment without content upload');
        await logAudit('error', session.customer_details?.email, null, 'stripe_session', {
          session_id: id,
          warning: 'Payment received but no order_id in metadata',
        }, false, 'Payment received but no order_id in metadata');

        await updatePaymentTracking({
          sessionId: id,
          paymentIntentId: typeof payment_intent === 'string' ? payment_intent : payment_intent?.id,
          customerId: customer,
          customerEmail: session.customer_details?.email || metadata.user_email,
          customerName: session.customer_details?.name,
          amountCents: amount_total || 0,
          planId: metadata.plan_id,
          paymentReceived: true,
          contentUploaded: false,
          activationFailedReason: 'No order_id in metadata - user did not upload content',
        });
      }
    } catch (error) {
      console.error('Error processing one-time payment:', error);
    }
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.info(`Payment intent succeeded: ${paymentIntent.id}`);

  if (paymentIntent.invoice) {
    console.info('Payment is part of subscription, skipping direct handling');
    return;
  }

  const { customer } = paymentIntent;

  if (customer && typeof customer === 'string') {
    const { error } = await supabase
      .from('stripe_orders')
      .update({ payment_status: 'paid', status: 'completed' })
      .eq('payment_intent_id', paymentIntent.id);

    if (error) {
      console.error('Error updating order status:', error);
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.error(`Payment intent failed: ${paymentIntent.id}`);

  const { error } = await supabase
    .from('stripe_orders')
    .update({ payment_status: 'failed', status: 'failed' })
    .eq('payment_intent_id', paymentIntent.id);

  if (error) {
    console.error('Error updating failed order:', error);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const { customer } = subscription;

  if (!customer || typeof customer !== 'string') {
    console.error('No customer in subscription event');
    return;
  }

  console.info(`Syncing subscription for customer: ${customer}`);
  await syncCustomerFromStripe(customer);
}

async function activateQueueItemAfterPayment(queueItemId: string, customerEmail?: string, customerName?: string, customerId?: string) {
  try {
    console.info(`Starting activation for queue item: ${queueItemId}`);
    await logAudit('webhook_processed', customerEmail, queueItemId, 'queue_item', {
      queue_item_id: queueItemId,
      customer_email: customerEmail,
    }, true);

    const now = new Date();
    const endOf24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: originalItem, error: fetchError } = await supabase
      .from('queue_items')
      .select('*')
      .eq('id', queueItemId)
      .maybeSingle();

    if (fetchError || !originalItem) {
      console.error('Error fetching queue item:', fetchError);
      await logAudit('error', customerEmail, queueItemId, 'queue_item', {
        error: fetchError?.message || 'Queue item not found',
      }, false, `Error fetching queue item: ${fetchError?.message || 'Not found'}`);
      await updatePaymentTracking({
        queueItemId,
        webhookProcessed: true,
        contentActivated: false,
        activationFailedReason: `Queue item not found: ${fetchError?.message || 'Not found'}`,
      });
      return;
    }

    const isAdminContent = originalItem.metadata?.is_admin_content === true;

    if (isAdminContent) {
      const existingMetadata = originalItem.metadata || {};
      const { error } = await supabase
        .from('queue_items')
        .update({
          status: 'active',
          published_at: now.toISOString(),
          metadata: {
            ...existingMetadata,
            customer_email: customerEmail,
            customer_name: customerName,
            stripe_customer_id: customerId,
            payment_date: now.toISOString(),
            payment_status: 'confirmed',
            display_status: 'published',
          },
        })
        .eq('id', queueItemId);

      if (error) {
        console.error('Error activating admin queue item:', error);
        await logAudit('error', customerEmail, queueItemId, 'queue_item', {
          error: error.message,
        }, false, `Error activating admin queue item: ${error.message}`);
        await updatePaymentTracking({
          queueItemId,
          webhookProcessed: true,
          contentActivated: false,
          activationFailedReason: `Error activating admin content: ${error.message}`,
        });
        return;
      }

      console.info(`Admin queue item activated without auto-scheduling: ${queueItemId}`);
      await logAudit('content_activated', customerEmail, queueItemId, 'queue_item', {
        queue_item_id: queueItemId,
        is_admin_content: true,
      }, true);
      await updatePaymentTracking({
        queueItemId,
        webhookProcessed: true,
        contentActivated: true,
        activationTimestamp: now,
      });
      return;
    }

    const { data: maxOrderData } = await supabase
      .from('queue_items')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const maxOrderIndex = maxOrderData?.order_index ?? 0;
    console.info(`Current max order_index: ${maxOrderIndex}, will add items starting at ${maxOrderIndex + 1}`);

    const eightHours = 8 * 60 * 60 * 1000;
    const contentDurationMs = (originalItem.duration || 10) * 1000;

    const itemsToCreate = [
      {
        user_id: originalItem.user_id,
        kiosk_id: originalItem.kiosk_id,
        media_url: originalItem.media_url,
        media_type: originalItem.media_type,
        thumbnail_url: originalItem.thumbnail_url,
        title: originalItem.title,
        duration: originalItem.duration,
        border_id: originalItem.border_id,
        file_name: originalItem.file_name,
        order_index: maxOrderIndex + 1,
        status: 'active',
        published_at: now.toISOString(),
        scheduled_start: null,
        scheduled_end: null,
        auto_delete_on_expire: false,
        metadata: {
          ...(originalItem.metadata || {}),
          customer_email: customerEmail,
          customer_name: customerName,
          stripe_customer_id: customerId,
          payment_date: now.toISOString(),
          payment_status: 'confirmed',
          display_status: 'published',
          original_queue_item_id: queueItemId,
          auto_scheduled_slot: 1,
          slot_type: 'immediate',
          is_user_paid_content: true,
          is_admin_content: false,
        },
      },
      {
        user_id: originalItem.user_id,
        kiosk_id: originalItem.kiosk_id,
        media_url: originalItem.media_url,
        media_type: originalItem.media_type,
        thumbnail_url: originalItem.thumbnail_url,
        title: originalItem.title,
        duration: originalItem.duration,
        border_id: originalItem.border_id,
        file_name: originalItem.file_name,
        order_index: maxOrderIndex + 2,
        status: 'active',
        published_at: new Date(now.getTime() + eightHours).toISOString(),
        scheduled_start: new Date(now.getTime() + eightHours).toISOString(),
        scheduled_end: new Date(now.getTime() + eightHours + contentDurationMs).toISOString(),
        auto_delete_on_expire: true,
        metadata: {
          ...(originalItem.metadata || {}),
          customer_email: customerEmail,
          customer_name: customerName,
          stripe_customer_id: customerId,
          payment_date: now.toISOString(),
          payment_status: 'confirmed',
          display_status: 'published',
          original_queue_item_id: queueItemId,
          auto_scheduled_slot: 2,
          slot_type: 'scheduled',
          is_user_paid_content: true,
          is_admin_content: false,
        },
      },
      {
        user_id: originalItem.user_id,
        kiosk_id: originalItem.kiosk_id,
        media_url: originalItem.media_url,
        media_type: originalItem.media_type,
        thumbnail_url: originalItem.thumbnail_url,
        title: originalItem.title,
        duration: originalItem.duration,
        border_id: originalItem.border_id,
        file_name: originalItem.file_name,
        order_index: maxOrderIndex + 3,
        status: 'active',
        published_at: new Date(now.getTime() + eightHours * 2).toISOString(),
        scheduled_start: new Date(now.getTime() + eightHours * 2).toISOString(),
        scheduled_end: new Date(now.getTime() + eightHours * 2 + contentDurationMs).toISOString(),
        auto_delete_on_expire: true,
        metadata: {
          ...(originalItem.metadata || {}),
          customer_email: customerEmail,
          customer_name: customerName,
          stripe_customer_id: customerId,
          payment_date: now.toISOString(),
          payment_status: 'confirmed',
          display_status: 'published',
          original_queue_item_id: queueItemId,
          auto_scheduled_slot: 3,
          slot_type: 'scheduled',
          is_user_paid_content: true,
          is_admin_content: false,
        },
      },
    ];

    const { error: deleteError } = await supabase
      .from('queue_items')
      .delete()
      .eq('id', queueItemId);

    if (deleteError) {
      console.error('Error deleting original queue item:', deleteError);
    }

    const { error: insertError } = await supabase
      .from('queue_items')
      .insert(itemsToCreate);

    if (insertError) {
      console.error('Error creating scheduled queue items:', insertError);
      await logAudit('error', customerEmail, queueItemId, 'queue_item', {
        error: insertError.message,
      }, false, `Error creating scheduled queue items: ${insertError.message}`);
      await updatePaymentTracking({
        queueItemId,
        webhookProcessed: true,
        contentActivated: false,
        activationFailedReason: `Error creating scheduled items: ${insertError.message}`,
      });
      return;
    }

    console.info(`Created 3 queue items for customer: ${customerEmail}`);
    console.info(`Content duration: ${originalItem.duration}s`);
    console.info(`Slot 1 (immediate): order_index ${maxOrderIndex + 1}, active now, added to END of queue`);
    console.info(`Slot 2 (scheduled): order_index ${maxOrderIndex + 2}, shows at ${new Date(now.getTime() + eightHours).toISOString()}`);
    console.info(`Slot 3 (scheduled): order_index ${maxOrderIndex + 3}, shows at ${new Date(now.getTime() + eightHours * 2).toISOString()}`);

    await logAudit('content_activated', customerEmail, queueItemId, 'queue_item', {
      queue_item_id: queueItemId,
      slots_created: 3,
      customer_email: customerEmail,
    }, true);

    await updatePaymentTracking({
      queueItemId,
      webhookProcessed: true,
      contentActivated: true,
      activationTimestamp: now,
    });
  } catch (error) {
    console.error('Error in activateQueueItemAfterPayment:', error);
    await logAudit('error', customerEmail, queueItemId, 'queue_item', {
      error: error.message,
      stack: error.stack,
    }, false, `Critical error in activateQueueItemAfterPayment: ${error.message}`);
    await updatePaymentTracking({
      queueItemId,
      webhookProcessed: true,
      contentActivated: false,
      activationFailedReason: `Exception: ${error.message}`,
    });
  }
}

async function syncCustomerFromStripe(customerId: string) {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      console.info(`No active subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          subscription_status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
    }

    const subscription = subscriptions.data[0];

    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
        status: subscription.status,
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }
    console.info(`Successfully synced subscription for customer: ${customerId}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}

async function logAudit(
  eventType: string,
  userEmail?: string,
  relatedId?: string | null,
  relatedType?: string,
  metadata?: any,
  success: boolean = true,
  errorMessage?: string
) {
  try {
    await supabase.from('audit_logs').insert({
      event_type: eventType,
      user_email: userEmail,
      related_id: relatedId,
      related_type: relatedType,
      metadata: metadata || {},
      success,
      error_message: errorMessage,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}

async function updatePaymentTracking(data: {
  sessionId?: string;
  paymentIntentId?: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  amountCents?: number;
  planId?: string;
  queueItemId?: string;
  contentUploaded?: boolean;
  paymentReceived?: boolean;
  webhookProcessed?: boolean;
  contentActivated?: boolean;
  activationFailedReason?: string;
  paymentTimestamp?: Date;
  activationTimestamp?: Date;
}) {
  try {
    if (data.paymentIntentId) {
      const { error } = await supabase
        .from('payment_content_tracking')
        .upsert(
          {
            stripe_payment_intent_id: data.paymentIntentId,
            stripe_session_id: data.sessionId,
            stripe_customer_id: data.customerId,
            customer_email: data.customerEmail,
            customer_name: data.customerName,
            amount_cents: data.amountCents,
            plan_id: data.planId,
            queue_item_id: data.queueItemId,
            content_uploaded: data.contentUploaded,
            payment_received: data.paymentReceived,
            webhook_processed: data.webhookProcessed,
            content_activated: data.contentActivated,
            activation_failed_reason: data.activationFailedReason,
            payment_timestamp: data.paymentTimestamp?.toISOString(),
            activation_timestamp: data.activationTimestamp?.toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'stripe_payment_intent_id',
            ignoreDuplicates: false,
          }
        );

      if (error) {
        console.error('Error updating payment tracking:', error);
      }
    } else if (data.queueItemId) {
      const { error } = await supabase
        .from('payment_content_tracking')
        .update({
          webhook_processed: data.webhookProcessed,
          content_activated: data.contentActivated,
          activation_failed_reason: data.activationFailedReason,
          activation_timestamp: data.activationTimestamp?.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('queue_item_id', data.queueItemId);

      if (error) {
        console.error('Error updating payment tracking by queue_item_id:', error);
      }
    }
  } catch (error) {
    console.error('Error in updatePaymentTracking:', error);
  }
}

async function createOrUpdateCustomer(data: {
  email?: string;
  name?: string;
  phone?: string;
  stripeCustomerId?: string;
  billingAddress?: any;
}) {
  if (!data.email) {
    console.warn('Cannot create customer without email');
    return;
  }

  try {
    const customerData = {
      email: data.email,
      name: data.name,
      phone: data.phone,
      stripe_customer_id: data.stripeCustomerId,
      billing_address: data.billingAddress ? JSON.stringify(data.billingAddress) : null,
      metadata: {
        source: 'stripe_checkout',
        last_updated: new Date().toISOString(),
      },
    };

    const { error } = await supabase
      .from('customers')
      .upsert(
        customerData,
        {
          onConflict: 'email',
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error('Error creating/updating customer:', error);
      return;
    }

    console.info(`Customer record created/updated for: ${data.email}`);
  } catch (error) {
    console.error('Error in createOrUpdateCustomer:', error);
  }
}
