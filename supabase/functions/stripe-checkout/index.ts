import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
if (!stripeSecret) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'ShowYo Checkout',
    version: '1.0.0',
  },
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const STRIPE_PRICE_IDS: Record<string, string> = {
  'photo-logo': 'price_1S8tkJF6Bz1PoBh55VqRIrC3',
  'photo-border-logo': 'price_1S8tn8F6Bz1PoBh5nT9k1JT3',
  'photo-clean': 'price_1S8tpmF6Bz1PoBh5FA5LLqTK',
  'video-logo': 'price_1S8tqdF6Bz1PoBh5PKK3WZe9',
  'video-border-logo': 'price_1S8trAF6Bz1PoBh5S1knkYcR',
  'video-clean': 'price_1S8treF6Bz1PoBh59KkmfJiu',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const { order_id, plan_id, user_email, stripe_price_id } = await req.json();

    console.log('Creating checkout session:', { order_id, plan_id, user_email, stripe_price_id });

    if (!order_id || !plan_id || !user_email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: order_id, plan_id, user_email' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const priceId = stripe_price_id || STRIPE_PRICE_IDS[plan_id];

    if (!priceId) {
      console.error('Invalid plan_id or stripe_price_id:', { plan_id, stripe_price_id });
      return new Response(
        JSON.stringify({ error: `Invalid plan: ${plan_id}. No Stripe Price ID found.` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const baseUrl = req.headers.get('origin') || 'https://showyotest.netlify.app';
    const successUrl = `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order_id}`;
    const cancelUrl = `${baseUrl}/upload`;

    console.log('Creating Stripe session with price:', priceId);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: user_email,
      metadata: {
        order_id: order_id,
        plan_id: plan_id,
        user_email: user_email,
      },
    });

    console.log('Checkout session created successfully:', session.id);

    return new Response(
      JSON.stringify({
        url: session.url,
        sessionId: session.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create checkout session',
        details: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
