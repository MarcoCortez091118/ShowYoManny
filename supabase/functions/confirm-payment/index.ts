import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'ShowYo Payment Confirmation',
    version: '1.0.0',
  },
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { session_id, order_id } = await req.json();

    console.log('Confirming payment:', { session_id, order_id });

    if (!session_id || !order_id) {
      return new Response(
        JSON.stringify({ error: 'Missing session_id or order_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ error: 'Payment not completed', status: session.payment_status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already processed
    const { data: existingOrder } = await supabase
      .from('stripe_orders')
      .select('id')
      .eq('checkout_session_id', session_id)
      .maybeSingle();

    if (existingOrder) {
      console.log('Payment already processed');
      return new Response(
        JSON.stringify({ success: true, message: 'Payment already processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get queue item
    const { data: queueItem } = await supabase
      .from('queue_items')
      .select('*')
      .eq('id', order_id)
      .maybeSingle();

    if (!queueItem) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const scheduledEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Create customer record
    const customerEmail = session.customer_details?.email || queueItem.metadata?.user_email;
    const customerName = session.customer_details?.name;
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null;

    if (customerEmail) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id, total_purchases, total_spent')
        .eq('email', customerEmail)
        .maybeSingle();

      const amountUsd = (session.amount_total || 0) / 100;

      if (existingCustomer) {
        // Update existing customer
        await supabase
          .from('customers')
          .update({
            total_purchases: existingCustomer.total_purchases + 1,
            total_spent: parseFloat(existingCustomer.total_spent) + amountUsd,
            last_purchase_at: now.toISOString(),
            stripe_customer_id: stripeCustomerId || existingCustomer.stripe_customer_id,
            customer_segment: existingCustomer.total_purchases + 1 >= 5 ? 'vip' : 'returning',
            updated_at: now.toISOString(),
          })
          .eq('id', existingCustomer.id);
      } else {
        // Create new customer
        await supabase.from('customers').insert({
          email: customerEmail,
          name: customerName,
          phone: session.customer_details?.phone,
          stripe_customer_id: stripeCustomerId,
          total_purchases: 1,
          total_spent: amountUsd,
          first_purchase_at: now.toISOString(),
          last_purchase_at: now.toISOString(),
          billing_address: session.customer_details?.address,
          customer_segment: 'new',
          metadata: {
            source: 'stripe_checkout',
            first_order_id: order_id,
          },
        });
      }
    }

    // Create order record
    await supabase.from('stripe_orders').insert({
      checkout_session_id: session_id,
      payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || '',
      customer_id: stripeCustomerId || 'unknown',
      amount_subtotal: session.amount_subtotal || 0,
      amount_total: session.amount_total || 0,
      currency: session.currency || 'usd',
      payment_status: session.payment_status,
      status: 'completed',
      metadata: {
        order_id: order_id,
        customer_email: customerEmail,
        customer_name: customerName,
        plan_id: queueItem.metadata?.pricing_option_id,
      },
    });

    // Activate the queue item
    const { error: updateError } = await supabase
      .from('queue_items')
      .update({
        status: 'active',
        published_at: now.toISOString(),
        scheduled_end: scheduledEnd.toISOString(),
        metadata: {
          ...queueItem.metadata,
          customer_email: customerEmail,
          customer_name: customerName,
          stripe_customer_id: stripeCustomerId,
          payment_date: now.toISOString(),
          payment_confirmed: true,
          stripe_session_id: session_id,
        },
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('Error activating queue item:', updateError);
      throw updateError;
    }

    console.log(`Successfully activated order: ${order_id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment confirmed and content activated',
        expires_at: scheduledEnd.toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Payment confirmation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});