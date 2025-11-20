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

  if (!customer || typeof customer !== 'string') {
    console.error('No customer ID in checkout session');
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
        return;
      }

      await createOrUpdateCustomer({
        email: session.customer_details?.email || metadata?.user_email,
        name: session.customer_details?.name,
        phone: session.customer_details?.phone,
        stripeCustomerId: customer,
        billingAddress: session.customer_details?.address,
      });

      console.info(`Successfully processed one-time payment for session: ${id}`);

      if (metadata?.order_id) {
        await activateQueueItemAfterPayment(
          metadata.order_id,
          session.customer_details?.email || metadata.user_email,
          session.customer_details?.name || undefined,
          customer
        );
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
    const now = new Date();
    const endOf24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: originalItem, error: fetchError } = await supabase
      .from('queue_items')
      .select('*')
      .eq('id', queueItemId)
      .maybeSingle();

    if (fetchError || !originalItem) {
      console.error('Error fetching queue item:', fetchError);
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
          },
        })
        .eq('id', queueItemId);

      if (error) {
        console.error('Error activating admin queue item:', error);
        return;
      }

      console.info(`Admin queue item activated without auto-scheduling: ${queueItemId}`);
      return;
    }

    const eightHours = 8 * 60 * 60 * 1000;
    const schedules = [
      { start: now, end: new Date(now.getTime() + eightHours) },
      { start: new Date(now.getTime() + eightHours), end: new Date(now.getTime() + eightHours * 2) },
      { start: new Date(now.getTime() + eightHours * 2), end: endOf24Hours },
    ];

    const itemsToCreate = schedules.map((schedule, index) => ({
      user_id: originalItem.user_id,
      kiosk_id: originalItem.kiosk_id,
      media_url: originalItem.media_url,
      media_type: originalItem.media_type,
      thumbnail_url: originalItem.thumbnail_url,
      title: originalItem.title,
      duration: originalItem.duration,
      border_id: originalItem.border_id,
      file_name: originalItem.file_name,
      status: 'active',
      published_at: schedule.start.toISOString(),
      scheduled_start: schedule.start.toISOString(),
      scheduled_end: schedule.end.toISOString(),
      auto_delete_on_expire: true,
      metadata: {
        ...(originalItem.metadata || {}),
        customer_email: customerEmail,
        customer_name: customerName,
        stripe_customer_id: customerId,
        payment_date: now.toISOString(),
        original_queue_item_id: queueItemId,
        auto_scheduled_slot: index + 1,
        is_user_paid_content: true,
      },
    }));

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
      return;
    }

    console.info(`Created 3 auto-scheduled queue items for customer: ${customerEmail}`);
    console.info(`Slot 1: ${schedules[0].start.toISOString()} - ${schedules[0].end.toISOString()}`);
    console.info(`Slot 2: ${schedules[1].start.toISOString()} - ${schedules[1].end.toISOString()}`);
    console.info(`Slot 3: ${schedules[2].start.toISOString()} - ${schedules[2].end.toISOString()}`);
  } catch (error) {
    console.error('Error in activateQueueItemAfterPayment:', error);
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
