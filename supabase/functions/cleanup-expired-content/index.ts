import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();
    console.log('cleanup-expired-content: Running cleanup at', now);

    // Find expired content (scheduled_end has passed and auto_delete_after_end is true)
    const { data: expiredOrders, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('auto_delete_after_end', true)
      .not('scheduled_end', 'is', null)
      .lt('scheduled_end', now);

    if (fetchError) {
      console.error('cleanup-expired-content: Error fetching expired orders:', fetchError);
      throw fetchError;
    }

    console.log('cleanup-expired-content: Found', expiredOrders?.length || 0, 'expired orders');

    if (expiredOrders && expiredOrders.length > 0) {
      for (const order of expiredOrders) {
        console.log('cleanup-expired-content: Processing order', order.id, order.file_name);

        // Mark as completed
        await supabase
          .from('orders')
          .update({ 
            display_status: 'completed',
            display_completed_at: now,
            completed_by_system: true
          })
          .eq('id', order.id);

        // Remove from queue
        await supabase
          .from('content_queue')
          .delete()
          .eq('order_id', order.id);

        console.log('cleanup-expired-content: Removed order', order.id, 'from queue');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        cleaned: expiredOrders?.length || 0,
        message: `Cleaned up ${expiredOrders?.length || 0} expired content items`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('cleanup-expired-content: Error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
