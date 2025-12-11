import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const N8N_WEBHOOK_URL = 'https://n8n.srv991322.hstgr.cloud/webhook-test/stripe-payment-content-slots';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface WebhookPayload {
  customer_email: string;
  customer_name?: string;
  payment_status: 'paid' | 'not_paid';
  amount_cents: number;
  amount_dollars: number;
  currency: string;
  plan_id: string;
  media_type: 'image' | 'video';
  media_url: string;
  file_name?: string;
  slots: Array<{
    slot_number: number;
    slot_type: 'immediate' | 'scheduled';
    scheduled_start?: string;
    scheduled_end?: string;
    status: string;
    duration_seconds: number;
  }>;
  payment_date: string;
  content_activated: boolean;
}

Deno.serve(async (req: Request) => {
  try {
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

    const payload: WebhookPayload = await req.json();

    console.log('Sending webhook to n8n:', JSON.stringify(payload, null, 2));

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook failed:', response.status, errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: `n8n webhook returned ${response.status}`,
          details: errorText,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const result = await response.json().catch(() => ({ message: 'OK' }));
    console.log('n8n webhook success:', result);

    return new Response(
      JSON.stringify({ success: true, n8n_response: result }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in send-n8n-webhook:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
