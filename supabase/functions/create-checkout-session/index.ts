import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const { orderId, planId, userEmail } = await req.json();

    if (!orderId || !planId) {
      throw new Error("Missing required fields: orderId or planId");
    }

    console.log("Creating checkout session for order:", orderId, "plan:", planId);

    // Map plan IDs to Stripe Price IDs
    const stripePriceMap: Record<string, string> = {
      "photo-logo": "price_1S8tkJF6Bz1PoBh55VqRIrC3",
      "photo-border-logo": "price_1S8tn8F6Bz1PoBh5nT9k1JT3",
      "photo-clean": "price_1S8tpmF6Bz1PoBh5FA5LLqTK",
      "video-logo": "price_1S8tqdF6Bz1PoBh5PKK3WZe9",
      "video-border-logo": "price_1S8trAF6Bz1PoBh5S1knkYcR",
      "video-clean": "price_1S8treF6Bz1PoBh59KkmfJiu",
    };

    const stripePriceId = stripePriceMap[planId];
    if (!stripePriceId) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // We don't lookup customers to support restricted keys without customer read scope
    // Stripe will associate by email automatically via customer_email
    const customerEmail = userEmail || undefined;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${req.headers.get("origin")}/upload`,
      metadata: {
        order_id: orderId,
        plan_id: planId,
      },
    });

    console.log("Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Checkout session creation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
