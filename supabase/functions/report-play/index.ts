// Edge Function: report-play
// Tracks play events and enforces rules per ShowYo v2 spec

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { item_id, started_at, completed_at, success } = await req.json();
    
    if (!item_id || !success) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    console.log(`report-play: Recording play for item ${item_id}`);

    // Get the order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, content_queue(*)")
      .eq("id", item_id)
      .single();

    if (orderError || !order) {
      throw new Error(`Order not found: ${item_id}`);
    }

    // Increment play count
    const newPlayCount = (order.play_count || 0) + 1;
    
    console.log(`report-play: Incrementing play count to ${newPlayCount} for ${order.file_name}`);

    await supabase
      .from("orders")
      .update({
        play_count: newPlayCount,
        played_at: completed_at || new Date().toISOString()
      })
      .eq("id", item_id);

    // Log play to history (for interval and daily caps enforcement)
    await supabase
      .from("played_content_history")
      .insert({
        order_id: item_id,
        user_email: order.user_email,
        pricing_option_id: order.pricing_option_id,
        file_name: order.file_name,
        file_path: order.file_path,
        border_id: order.border_id,
        revenue_cents: order.price_cents || 0,
        completed_at: completed_at || new Date().toISOString()
      });

    // Check if item should be auto-deleted (ONLY paid customer content after 1 play)
    // Admin content and scheduled items should NEVER be auto-deleted
    const isPaidCustomerContent = order.pricing_option_id && !order.is_admin_content;
    const shouldAutoDelete = isPaidCustomerContent && newPlayCount >= 1;

    if (shouldAutoDelete) {
      console.log(`report-play: Auto-deleting paid content after play: ${order.file_name}`);
      
      // Remove from queue
      await supabase
        .from("content_queue")
        .delete()
        .eq("order_id", item_id);
      
      // Mark order as completed
      await supabase
        .from("orders")
        .update({
          display_status: "completed",
          display_completed_at: new Date().toISOString()
        })
        .eq("id", item_id);
      
      // History already logged above
    }

    // Check if item has reached max plays per day
    const maxPlays = order.max_plays || 10;
    if (newPlayCount >= maxPlays) {
      console.log(`report-play: Item ${order.file_name} has reached daily cap (${newPlayCount}/${maxPlays})`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      play_count: newPlayCount,
      auto_deleted: shouldAutoDelete,
      reached_cap: newPlayCount >= maxPlays
    }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      status: 200,
    });
  } catch (e) {
    console.error("report-play error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 500,
    });
  }
});
