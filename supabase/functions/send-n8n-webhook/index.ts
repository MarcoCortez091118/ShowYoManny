import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const N8N_WEBHOOK_URL = 'https://n8n.srv991322.hstgr.cloud/webhook/stripe-payment-content-slots';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SlotPayload {
  slot_number: number;
  slot_type: 'immediate' | 'scheduled';
  scheduled_start: string | null;
  scheduled_end: string | null;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  duration_seconds: number;
}

interface N8nPayload {
  event_id: string;
  event_type: 'payment.content_slots.activated';
  source: 'supabase';

  stripe_event_id?: string | null;
  checkout_session_id?: string | null;
  payment_intent_id?: string | null;

  order_id?: string | null;
  content_id?: string | null;

  customer_email: string;
  customer_name: string;

  payment_status: 'paid';
  content_activated: true;

  amount_cents: number;
  amount_dollars: number;
  currency: string;

  plan_id: string;

  media_type: 'image' | 'video';
  media_url: string;
  file_name: string;

  payment_date: string;

  slots: SlotPayload[];

  queue_position?: number | null;
  total_items_in_queue?: number | null;
  estimated_display_time?: string | null;
  estimated_wait_seconds?: number | null;
  display_duration_seconds?: number | null;
}

function validatePayload(payload: any): { valid: boolean; error?: string; sanitized?: N8nPayload } {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload must be a non-null object' };
  }

  if (payload.payment_status !== 'paid') {
    return { valid: false, error: 'Webhook not sent: payment is not confirmed' };
  }

  if (payload.content_activated !== true) {
    return { valid: false, error: 'Webhook not sent: content is not activated' };
  }

  const slots = Array.isArray(payload.slots) ? payload.slots : [];
  const activeSlots = slots.filter((s: any) => s.status === 'active');

  if (activeSlots.length === 0) {
    return { valid: false, error: 'Webhook not sent: no active slots' };
  }

  const customerEmail = payload.customer_email;
  const customerName = payload.customer_name;
  const planId = payload.plan_id;
  const mediaType = payload.media_type;
  const mediaUrl = payload.media_url;
  const fileName = payload.file_name;

  if (!customerEmail || !customerName || !planId || !mediaType || !mediaUrl || !fileName) {
    const missing = [];
    if (!customerEmail) missing.push('customer_email');
    if (!customerName) missing.push('customer_name');
    if (!planId) missing.push('plan_id');
    if (!mediaType) missing.push('media_type');
    if (!mediaUrl) missing.push('media_url');
    if (!fileName) missing.push('file_name');
    return { valid: false, error: `Webhook not sent: missing required fields: ${missing.join(', ')}` };
  }

  if (!['image', 'video'].includes(mediaType)) {
    return { valid: false, error: `Webhook not sent: unsupported media type: ${mediaType}` };
  }

  if (!payload.event_id) {
    return { valid: false, error: 'Webhook not sent: missing event_id' };
  }

  const amountCents = Number(payload.amount_cents) || 0;
  const amountDollars = Number((amountCents / 100).toFixed(2));

  const sanitized: N8nPayload = {
    event_id: payload.event_id,
    event_type: 'payment.content_slots.activated',
    source: 'supabase',

    stripe_event_id: payload.stripe_event_id ?? null,
    checkout_session_id: payload.checkout_session_id ?? null,
    payment_intent_id: payload.payment_intent_id ?? null,

    order_id: payload.order_id ?? null,
    content_id: payload.content_id ?? null,

    customer_email: customerEmail,
    customer_name: customerName,

    payment_status: 'paid',
    content_activated: true,

    amount_cents: amountCents,
    amount_dollars: amountDollars,
    currency: String(payload.currency ?? 'usd').toLowerCase(),

    plan_id: planId,

    media_type: mediaType as 'image' | 'video',
    media_url: mediaUrl,
    file_name: fileName,

    payment_date: payload.payment_date || new Date().toISOString(),

    slots: activeSlots.map((slot: any) => ({
      slot_number: Number(slot.slot_number),
      slot_type: slot.slot_type as 'immediate' | 'scheduled',
      scheduled_start: slot.scheduled_start ?? null,
      scheduled_end: slot.scheduled_end ?? null,
      status: slot.status as 'active',
      duration_seconds: Number(slot.duration_seconds),
    })),

    queue_position: payload.queue_position ?? null,
    total_items_in_queue: payload.total_items_in_queue ?? null,
    estimated_display_time: payload.estimated_display_time ?? null,
    estimated_wait_seconds: payload.estimated_wait_seconds ?? null,
    display_duration_seconds: payload.display_duration_seconds ?? null,
  };

  return { valid: true, sanitized };
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = await req.json();

    const validation = validatePayload(payload);

    if (!validation.valid) {
      console.error('N8N_WEBHOOK_VALIDATION_FAILED', {
        error: validation.error,
        event_id: payload?.event_id,
        order_id: payload?.order_id,
      });

      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const n8nPayload = validation.sanitized!;

    console.log('N8N_WEBHOOK_SENDING', {
      event_id: n8nPayload.event_id,
      order_id: n8nPayload.order_id,
      content_id: n8nPayload.content_id,
      customer_email: n8nPayload.customer_email,
      plan_id: n8nPayload.plan_id,
      slots_count: n8nPayload.slots.length,
    });

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error('N8N_WEBHOOK_FAILED', {
        status: response.status,
        response: responseText,
        event_id: n8nPayload.event_id,
        order_id: n8nPayload.order_id,
        content_id: n8nPayload.content_id,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: `N8N webhook failed with HTTP ${response.status}`,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = (() => {
      try { return JSON.parse(responseText); } catch { return { message: responseText || 'OK' }; }
    })();

    console.log('N8N_WEBHOOK_SENT', {
      status: response.status,
      event_id: n8nPayload.event_id,
      order_id: n8nPayload.order_id,
      content_id: n8nPayload.content_id,
    });

    return new Response(
      JSON.stringify({ success: true, n8n_response: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('N8N_WEBHOOK_ERROR', { error: error.message });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
