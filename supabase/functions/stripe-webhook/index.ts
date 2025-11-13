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
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
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
        metadata: metadata || {},
      };

      const { error: orderError } = await supabase.from('stripe_orders').insert(orderData);

      if (orderError) {
        console.error('Error inserting order:', orderError);
        return;
      }

      console.info(`Successfully processed one-time payment for session: ${id}`);

      if (metadata?.user_id && metadata?.plan_id) {
        await createQueueItemFromPayment({
          userId: metadata.user_id,
          planId: metadata.plan_id,
          orderId: id,
          mediaUrl: metadata.media_url || '',
          title: metadata.title || 'Untitled',
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

async function createQueueItemFromPayment(params: {
  userId: string;
  planId: string;
  orderId: string;
  mediaUrl: string;
  title: string;
}) {
  const { userId, planId, orderId, mediaUrl, title } = params;

  try {
    const now = new Date();
    const scheduledStart = now.toISOString();

    const { error } = await supabase.from('queue_items').insert({
      user_id: userId,
      media_url: mediaUrl,
      title: title,
      file_name: title,
      media_type: mediaUrl.includes('.mp4') || mediaUrl.includes('.mov') ? 'video' : 'image',
      duration: 10,
      scheduled_start: scheduledStart,
      order: 0,
      is_visible: true,
      status: 'active',
    });

    if (error) {
      console.error('Error creating queue item:', error);
      return;
    }

    console.info(`Queue item created for order: ${orderId}`);
  } catch (error) {
    console.error('Error in createQueueItemFromPayment:', error);
  }
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId: string) {
  try {
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    // TODO verify if needed
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

    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];

    // store subscription state
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