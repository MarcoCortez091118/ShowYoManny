// Edge Function: get-queue
// Returns the full ordered display queue joined with order details, bypassing client RLS limits safely.
// Filters to only approved and displayable items and returns a simplified list for the kiosk/preview.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables");
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
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { data, error } = await supabase
      .from("content_queue")
      .select(`
        queue_position,
        is_active,
        orders (
          id,
          file_name,
          file_path,
          file_type,
          border_id,
          duration_seconds,
          user_email,
          display_status,
          moderation_status,
          scheduled_start,
          scheduled_end,
          repeat_enabled,
          repeat_interval_minutes,
          max_repeats,
          repeat_frequency_per_day,
          max_plays,
          pricing_option_id
        )
      `)
      .order("queue_position", { ascending: true });

    if (error) throw error;

    const now = new Date();
    console.log('get-queue: Current time:', now.toISOString());

    const allItems = (data || [])
      .map((row: any) => ({
        ...row.orders,
        queue_position: row.queue_position,
        is_active: row.is_active,
      }))
      .filter((item: any) => !!item && !!item.file_path)
      .filter((item: any) =>
        ["queued", "active", "playing"].includes(item.display_status) &&
        item.moderation_status === "approved"
      );

    console.log('get-queue: Total approved items:', allItems.length);

    const transformed = allItems.filter((item: any) => {
        const hasStart = !!item.scheduled_start;
        const hasEnd = !!item.scheduled_end;
        
        console.log('get-queue: Checking item:', {
          file_name: item.file_name,
          scheduled_start: item.scheduled_start,
          scheduled_end: item.scheduled_end,
          hasStart,
          hasEnd,
        });
        
        // If no scheduling, show the item
        if (!hasStart && !hasEnd) {
          console.log('  → SHOW (no schedule)');
          return true;
        }
        
        // If only start time is set, show if current time >= start time
        if (hasStart && !hasEnd) {
          const startTime = new Date(item.scheduled_start);
          const shouldShow = now >= startTime;
          console.log('  → ' + (shouldShow ? 'SHOW' : 'HIDE') + ' (start-only, now >= start:', shouldShow + ')');
          return shouldShow;
        }
        
        // If only end time is set, show if current time <= end time
        if (!hasStart && hasEnd) {
          const endTime = new Date(item.scheduled_end);
          const shouldShow = now <= endTime;
          console.log('  → ' + (shouldShow ? 'SHOW' : 'HIDE') + ' (end-only, now <= end:', shouldShow + ')');
          return shouldShow;
        }
        
        // If both are set, show if current time is within the window
        if (hasStart && hasEnd) {
          const startTime = new Date(item.scheduled_start);
          const endTime = new Date(item.scheduled_end);
          const shouldShow = now >= startTime && now <= endTime;
          console.log('  → ' + (shouldShow ? 'SHOW' : 'HIDE') + ' (both, in window:', shouldShow + ')');
          return shouldShow;
        }
        
        console.log('  → HIDE (fallthrough)');
        return false;
      });

    console.log('get-queue: Filtered items count:', transformed.length);

    return new Response(JSON.stringify({ items: transformed }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 200,
    });
  } catch (e) {
    console.error("get-queue error", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 500,
    });
  }
});
