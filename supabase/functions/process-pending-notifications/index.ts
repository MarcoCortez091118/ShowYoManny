import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const N8N_WEBHOOK_URL = 'https://n8n.srv991322.hstgr.cloud/webhook/stripe-payment-content-slots';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const now = new Date().toISOString();

    const { data: pendingNotifications, error: fetchError } = await supabase
      .from('pending_notifications')
      .select('*')
      .eq('status', 'pending')
      .lte('send_at', now)
      .order('send_at', { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error('Error fetching pending notifications:', fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: 'No pending notifications' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.info(`Processing ${pendingNotifications.length} pending notifications`);

    let sentCount = 0;
    let errorCount = 0;

    for (const notification of pendingNotifications) {
      try {
        const payload = notification.payload;

        const response = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          await supabase
            .from('pending_notifications')
            .update({ status: 'sent', sent_at: new Date().toISOString() })
            .eq('id', notification.id);
          sentCount++;
          console.info(`Notification ${notification.id} sent successfully`);
        } else {
          const errorText = await response.text();
          await supabase
            .from('pending_notifications')
            .update({ status: 'failed', error_message: `HTTP ${response.status}: ${errorText}` })
            .eq('id', notification.id);
          errorCount++;
          console.error(`Notification ${notification.id} failed: ${response.status}`);
        }
      } catch (err: any) {
        await supabase
          .from('pending_notifications')
          .update({ status: 'failed', error_message: err.message })
          .eq('id', notification.id);
        errorCount++;
        console.error(`Error processing notification ${notification.id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ processed: pendingNotifications.length, sent: sentCount, errors: errorCount }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in process-pending-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
