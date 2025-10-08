// Edge Function: generate-playlist
// Generates a playlist following ShowYo v2 spec (Section 8)
// Enforces scheduling windows, repeat rules, and priority ordering

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
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const now = new Date();
    const timezone = "America/New_York"; // TODO: Make configurable
    
    console.log('generate-playlist: Starting playlist generation at', now.toISOString());

    // Cleanup expired scheduled content
    const { data: expiredOrders, error: expiredError } = await supabase
      .from('orders')
      .select('id, file_name')
      .eq('auto_delete_after_end', true)
      .not('scheduled_end', 'is', null)
      .lt('scheduled_end', now.toISOString());

    if (expiredError) {
      console.error('generate-playlist: Error fetching expired orders:', expiredError);
    } else if (expiredOrders && expiredOrders.length > 0) {
      console.log('generate-playlist: Found', expiredOrders.length, 'expired scheduled items to cleanup');
      
      for (const order of expiredOrders) {
        console.log('generate-playlist: Cleaning up expired item:', order.file_name);
        
        // Mark as completed
        await supabase
          .from('orders')
          .update({ 
            display_status: 'completed',
            display_completed_at: now.toISOString(),
            completed_by_system: true
          })
          .eq('id', order.id);

        // Remove from queue
        await supabase
          .from('content_queue')
          .delete()
          .eq('order_id', order.id);
      }
    }

    // Fetch all items from content_queue joined with orders
    const { data, error } = await supabase
      .from("content_queue")
      .select(`
        id,
        queue_position,
        is_active,
        repeat_enabled,
        repeat_interval_minutes,
        max_repeats,
        repeat_count,
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
          pricing_option_id,
          is_admin_content,
          repeat_frequency_per_day,
          max_plays,
          play_count,
          played_at,
          timer_loop_enabled,
          timer_loop_minutes
        )
      `)
      .order("queue_position", { ascending: true });

    if (error) throw error;

    // Transform and filter items
    const allItems = (data || [])
      .map((row: any) => ({
        queue_id: row.id,
        queue_position: row.queue_position,
        is_active: row.is_active,
        // Preserve queue-level repeat settings separately
        q_repeat_enabled: row.repeat_enabled,
        q_repeat_interval_minutes: row.repeat_interval_minutes,
        max_repeats: row.max_repeats,
        repeat_count: row.repeat_count,
        // Keep original fields (may be overridden by order fields below)
        repeat_enabled: row.repeat_enabled,
        repeat_interval_minutes: row.repeat_interval_minutes,
        ...(row.orders || {}),
      }))
      .filter((item: any) => {
        // Must have required fields
        if (!item.file_path || !item.id) return false;
        
        // Must be approved and in playable status
        if (item.moderation_status !== "approved") return false;
        if (!["queued", "active", "playing"].includes(item.display_status)) return false;
        
        return true;
      });

    console.log('generate-playlist: Found', allItems.length, 'approved items before scheduling filter');

    // Apply scheduling window filter
    const scheduledItems = allItems.filter((item: any) => {
      const hasStart = !!item.scheduled_start;
      const hasEnd = !!item.scheduled_end;
      
      // No schedule = always show
      if (!hasStart && !hasEnd) {
        console.log(`generate-playlist: Item ${item.file_name} has no schedule, always showing`);
        return true;
      }
      
      // Only start time: show if now >= start
      if (hasStart && !hasEnd) {
        const start = new Date(item.scheduled_start);
        const shouldShow = now >= start;
        console.log(`generate-playlist: Item ${item.file_name} has start=${start.toISOString()}, now=${now.toISOString()}, showing=${shouldShow}`);
        return shouldShow;
      }
      
      // Only end time: show if now <= end
      if (!hasStart && hasEnd) {
        const end = new Date(item.scheduled_end);
        const shouldShow = now <= end;
        console.log(`generate-playlist: Item ${item.file_name} has end=${end.toISOString()}, now=${now.toISOString()}, showing=${shouldShow}`);
        return shouldShow;
      }
      
      // Both: show if now is within window
      if (hasStart && hasEnd) {
        const start = new Date(item.scheduled_start);
        const end = new Date(item.scheduled_end);
        const shouldShow = now >= start && now <= end;
        console.log(`generate-playlist: Item ${item.file_name} scheduled ${start.toISOString()} to ${end.toISOString()}, now=${now.toISOString()}, showing=${shouldShow}`);
        return shouldShow;
      }
      
      return false;
    });

    console.log('generate-playlist: After scheduling filter:', scheduledItems.length, 'items');

    // Get today's play counts per file (handles duplicate orders for same asset)
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    
    const filePaths = Array.from(new Set((scheduledItems || []).map((i: any) => i.file_path).filter(Boolean)));
    const { data: todaysPlays } = filePaths.length > 0
      ? await supabase
          .from('played_content_history')
          .select('file_path, completed_at')
          .in('file_path', filePaths)
          .gte('completed_at', startOfDay.toISOString())
      : { data: [], error: null } as any;
    
    // Count plays per file today and track last played time per file
    const playsTodayByFile = new Map<string, number>();
    const lastPlayedByFile = new Map<string, Date>();
    (todaysPlays || []).forEach((play: any) => {
      const fp = play.file_path as string;
      const currentCount = playsTodayByFile.get(fp) || 0;
      playsTodayByFile.set(fp, currentCount + 1);
      const completed = new Date(play.completed_at);
      const prev = lastPlayedByFile.get(fp);
      if (!prev || completed > prev) {
        lastPlayedByFile.set(fp, completed);
      }
    });

    // If needed, fetch latest play across all time per file
    if (filePaths.length > 0) {
      const { data: lastAny } = await supabase
        .from('played_content_history')
        .select('file_path, completed_at')
        .in('file_path', filePaths)
        .order('completed_at', { ascending: false });
      for (const row of (lastAny || [])) {
        const fp = row.file_path as string;
        if (fp && !lastPlayedByFile.has(fp)) {
          lastPlayedByFile.set(fp, new Date(row.completed_at));
        }
      }
    }

    // Build last play map for interval enforcement
    const orderIds = scheduledItems.map((i: any) => i.id).filter(Boolean);
    const lastPlayMap = new Map<string, Date>();
    if (orderIds.length > 0) {
      const { data: lastPlays, error: lastPlaysError } = await supabase
        .from('played_content_history')
        .select('order_id, completed_at')
        .in('order_id', orderIds)
        .order('completed_at', { ascending: false });
      if (lastPlaysError) {
        console.error('generate-playlist: Error fetching last plays:', lastPlaysError);
      } else {
        for (const row of (lastPlays || [])) {
          if (!lastPlayMap.has(row.order_id)) {
            lastPlayMap.set(row.order_id, new Date(row.completed_at));
          }
        }
      }
    }

    // Apply filters with interval and frequency rules
    const filteredItems = scheduledItems.filter((item: any) => {
      // Timer loop replaces old repeat options
      const loopEnabled = item.timer_loop_enabled === true;
      const loopMinutes = typeof item.timer_loop_minutes === 'number' ? item.timer_loop_minutes : 0;
      
      // Use timer as primary repeat mechanism, fall back to old repeat settings only if timer not enabled
      const intervalMinutes = loopEnabled && loopMinutes > 0
        ? loopMinutes
        : (item.q_repeat_interval_minutes || item.repeat_interval_minutes || 0);
      
      const repeatEnabled = loopEnabled || item.q_repeat_enabled === true || intervalMinutes > 0 || item.repeat_enabled === true;
      
      // For timer loop items, use paid_at as the baseline if never played (so it waits the full interval before first play)
      let lastPlayedAt: Date | undefined = item.played_at
        ? new Date(item.played_at)
        : (lastPlayMap.get(item.id) || (item.file_path ? lastPlayedByFile.get(item.file_path) : undefined));
      
      // If timer loop is enabled and no plays yet, use paid_at as starting point
      if (loopEnabled && loopMinutes > 0 && !lastPlayedAt && item.paid_at) {
        lastPlayedAt = new Date(item.paid_at);
        console.log(`generate-playlist: Item ${item.file_name} (timer loop) using paid_at as baseline: ${lastPlayedAt.toISOString()}`);
      }

      // Enforce repeat interval for ALL items if configured
      if (repeatEnabled && intervalMinutes > 0 && lastPlayedAt) {
        const nextAllowed = new Date(lastPlayedAt.getTime() + intervalMinutes * 60 * 1000);
        const shouldWait = now < nextAllowed;
        if (shouldWait) {
          const waitMinutes = Math.ceil((nextAllowed.getTime() - now.getTime()) / 60000);
          console.log(`generate-playlist: Item ${item.file_name} waiting for interval (${intervalMinutes}m). Next allowed in ${waitMinutes}m at ${nextAllowed.toISOString()}`);
          return false;
        }
      }

      const hasSchedule = !!item.scheduled_start || !!item.scheduled_end;
      
      // Items WITH a schedule window: note but still enforce interval and daily caps
      if (hasSchedule) {
        console.log(`generate-playlist: Item ${item.file_name} has schedule; interval and daily caps still apply`);
      }
      
      // Admin content: note but still enforce interval and daily caps
      if (item.is_admin_content) {
        console.log(`generate-playlist: Item ${item.file_name} is admin content; interval and daily caps still apply`);
      }
      
      // Apply per-day repeat frequency for ALL items when set
      const repeatFreqPerDay = item.repeat_frequency_per_day;
      const fp = item.file_path || '';
      const todayPlayCount = fp ? (playsTodayByFile.get(fp) || 0) : 0;
      const isPaid = !!(item.pricing_option_id && !item.is_admin_content);
      const enforceDaily = isPaid;
      if (enforceDaily && repeatFreqPerDay && todayPlayCount >= repeatFreqPerDay) {
        console.log(`generate-playlist: Item ${item.file_name} capped today (${todayPlayCount}/${repeatFreqPerDay})`);
        return false;
      }
      
      console.log(`generate-playlist: Item ${item.file_name} eligible to play (${todayPlayCount}/${repeatFreqPerDay || 'unlimited'} plays today)`);
      return true;
    });

    console.log('generate-playlist: After filtering:', filteredItems.length, 'items');

    // Sort by priority: paid > admin > house (within same priority, use queue_position)
    const sortedItems = filteredItems.sort((a: any, b: any) => {
      const getPriority = (item: any) => {
        if (item.pricing_option_id && !item.is_admin_content) return 1; // paid
        if (item.is_admin_content) return 2; // admin
        return 3; // house
      };
      
      const aPriority = getPriority(a);
      const bPriority = getPriority(b);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Same priority, use queue_position
      return (a.queue_position || 0) - (b.queue_position || 0);
    });

    // Build playlist following spec schema (Section 8)
    const playlistItems = sortedItems.map((item: any) => {
      const priority = item.pricing_option_id && !item.is_admin_content ? "paid" 
        : item.is_admin_content ? "admin" 
        : "house";
      
      return {
        id: item.id,
        type: item.file_type?.startsWith("image/") ? "photo" : "video",
        src: item.file_path,
        duration_sec: item.duration_seconds || 10,
        fit_mode: "fit", // Default to fit (no crop) per spec Section 5
        overlay: item.border_id && item.border_id !== "none" ? {
          border_id: item.border_id,
          z: 10
        } : null,
        priority,
        window: {
          start_at: item.scheduled_start || null,
          end_at: item.scheduled_end || null
        },
        repeat: {
          mode: item.repeat_frequency_per_day === 1 ? "once" 
            : item.repeat_enabled ? "interval" 
            : "unlimited",
          n: item.repeat_frequency_per_day || null,
          interval_minutes: item.repeat_interval_minutes || null
        },
        caps: {
          max_plays_per_day: item.max_plays || 10,
          current_plays: item.play_count || 0
        },
        delete_after_play: priority === "paid" && !item.is_admin_content,
        pricing_option_id: item.pricing_option_id,
        file_name: item.file_name,
        user_email: item.user_email
      };
    });

    const playlist = {
      version: 2,
      generated_at: now.toISOString(),
      timezone,
      canvas: { width: 2048, height: 2432 },
      items: playlistItems
    };

    console.log('generate-playlist: Generated playlist with', playlist.items.length, 'items');

    return new Response(JSON.stringify(playlist), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      },
      status: 200,
    });
  } catch (e) {
    console.error("generate-playlist error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      status: 500,
    });
  }
});
