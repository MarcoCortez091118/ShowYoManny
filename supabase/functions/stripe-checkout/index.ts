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
    const { order_id, plan_id, user_email, media_url, title } = await req.json();

    console.log('Creating checkout session:', { order_id, plan_id, user_email });

    if (!order_id || !plan_id || !user_email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: order_id, plan_id, user_email' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const planPrices: Record<string, { price: number; name: string }> = {
      'basic_10s': { price: 1000, name: 'Photo with Logo - 10s' },
      'border_10s': { price: 1500, name: 'Photo with Border + Logo - 10s' },
      'clean_10s': { price: 1500, name: 'Clean Photo - 10s' },
      'video_basic': { price: 2500, name: 'Video with Logo' },
      'video_clean': { price: 3000, name: 'Clean Video' },
    };

    const planInfo = planPrices[plan_id];
    if (!planInfo) {
      return new Response(
        JSON.stringify({ error: `Invalid plan_id: ${plan_id}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const baseUrl = req.headers.get('origin') || 'https://showyotest.netlify.app';
    const successUrl = `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order_id}`;
    const cancelUrl = `${baseUrl}/upload`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planInfo.name,
              description: title || 'Digital Billboard Content',
            },
            unit_amount: planInfo.price,
          },
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
        media_url: media_url || '',
        title: title || '',
      },
    });

    console.log('Checkout session created:', session.id);

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
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
