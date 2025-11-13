# Stripe Webhook Configuration

## Overview

This project uses **Supabase Edge Functions** to handle Stripe webhooks. The webhook endpoint is already deployed and ready to receive events from Stripe.

## Webhook URL

The webhook endpoint is available at:

```
https://[YOUR-PROJECT-ID].supabase.co/functions/v1/stripe-webhook
```

Replace `[YOUR-PROJECT-ID]` with your actual Supabase project ID.

## Supported Events

The webhook handler processes the following Stripe events:

| Event Type | Description | Action |
|------------|-------------|--------|
| `checkout.session.completed` | Payment successful | Creates order and queue item |
| `payment_intent.succeeded` | Payment confirmed | Updates order status |
| `payment_intent.payment_failed` | Payment failed | Marks order as failed |
| `customer.subscription.created` | New subscription | Syncs subscription data |
| `customer.subscription.updated` | Subscription changed | Updates subscription data |
| `customer.subscription.deleted` | Subscription cancelled | Updates subscription status |

## Configuration Steps

### 1. Get Your Stripe Webhook Secret

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://[YOUR-PROJECT-ID].supabase.co/functions/v1/stripe-webhook
   ```
4. Select the following events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

### 2. Configure Environment Variables

The webhook requires two environment variables in Supabase:

```bash
STRIPE_SECRET_KEY=sk_live_... or sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

These are already configured in your Supabase project. To update them:

1. Go to Supabase Dashboard → Project Settings → Edge Functions
2. Add or update the secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_...
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 3. Test the Webhook

You can test the webhook using the Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to your local endpoint (for testing)
stripe listen --forward-to https://[YOUR-PROJECT-ID].supabase.co/functions/v1/stripe-webhook

# Trigger a test event
stripe trigger checkout.session.completed
```

## How It Works

### Payment Flow

1. **User completes checkout** → Stripe creates a Checkout Session
2. **Payment succeeds** → Stripe sends `checkout.session.completed` event
3. **Webhook receives event** → Validates signature with `STRIPE_WEBHOOK_SECRET`
4. **Handler processes event**:
   - Inserts order into `stripe_orders` table
   - If metadata contains `user_id` and `plan_id`:
     - Creates queue item in `queue_items` table
     - Content goes live immediately
5. **Returns 200 OK** → Stripe marks webhook as successful

### Subscription Flow

1. **User subscribes** → Stripe creates a Subscription
2. **Subscription created** → Stripe sends `customer.subscription.created` event
3. **Webhook syncs data** → Updates `stripe_subscriptions` table
4. **Future updates** → Webhook keeps subscription data in sync

## Metadata Requirements

For automatic queue item creation, include these fields in the Checkout Session metadata:

```javascript
const session = await stripe.checkout.sessions.create({
  // ... other params
  metadata: {
    user_id: 'uuid-of-user',
    plan_id: 'plan-identifier',
    media_url: 'https://storage.url/media.mp4',
    title: 'My Billboard Content'
  }
});
```

## Security

The webhook handler includes several security measures:

1. **Signature Verification**: Uses `stripe.webhooks.constructEvent` with the webhook secret
2. **Service Role Key**: Uses Supabase service role for database operations
3. **Error Handling**: Comprehensive try-catch blocks with logging
4. **Idempotency**: Stripe automatically handles duplicate webhook deliveries

## Database Tables

The webhook writes to these Supabase tables:

### `stripe_orders`

Stores one-time payment records:

```sql
- checkout_session_id (text, primary key)
- payment_intent_id (text)
- customer_id (text)
- amount_subtotal (bigint)
- amount_total (bigint)
- currency (text)
- payment_status (text)
- status (text)
- metadata (jsonb)
- created_at (timestamptz)
```

### `stripe_subscriptions`

Stores subscription data:

```sql
- customer_id (text, primary key)
- subscription_id (text)
- price_id (text)
- current_period_start (bigint)
- current_period_end (bigint)
- cancel_at_period_end (boolean)
- payment_method_brand (text)
- payment_method_last4 (text)
- status (text)
```

### `queue_items`

Content queue for billboard display:

```sql
- id (uuid, primary key)
- user_id (uuid)
- media_url (text)
- title (text)
- file_name (text)
- media_type (text)
- duration (integer)
- scheduled_start (timestamptz)
- order (integer)
- is_visible (boolean)
- status (text)
```

## Monitoring

### View Webhook Logs

1. **Stripe Dashboard**:
   - Go to Developers → Webhooks → [Your endpoint]
   - View recent deliveries and responses

2. **Supabase Logs**:
   - Go to Supabase Dashboard → Edge Functions → stripe-webhook
   - View function logs

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Missing or invalid webhook secret | Verify `STRIPE_WEBHOOK_SECRET` is set correctly |
| 400 Bad Request | Invalid signature | Ensure webhook secret matches Stripe dashboard |
| 500 Server Error | Database error | Check Supabase logs for details |
| No queue item created | Missing metadata | Include `user_id`, `plan_id`, `media_url` in metadata |

## Testing Checklist

- [ ] Webhook endpoint is accessible
- [ ] `STRIPE_SECRET_KEY` is configured
- [ ] `STRIPE_WEBHOOK_SECRET` is configured
- [ ] Webhook is registered in Stripe Dashboard
- [ ] Test event successfully processed
- [ ] Order created in `stripe_orders` table
- [ ] Queue item created in `queue_items` table (if metadata provided)
- [ ] Webhook logs show no errors

## Example Webhook Event

```json
{
  "id": "evt_1234567890",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_1234567890",
      "customer": "cus_1234567890",
      "mode": "payment",
      "payment_status": "paid",
      "amount_total": 1000,
      "currency": "usd",
      "metadata": {
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "plan_id": "basic_10s",
        "media_url": "https://storage.supabase.co/content/video.mp4",
        "title": "My Awesome Content"
      }
    }
  }
}
```

## Support

For issues or questions:
- Check Supabase Edge Function logs
- Review Stripe webhook delivery logs
- Verify environment variables are set correctly
- Test with Stripe CLI trigger events
