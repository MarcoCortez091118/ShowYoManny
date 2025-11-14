# Stripe Setup Instructions

## ⚠️ Important: Two Places to Configure

Stripe credentials need to be configured in **TWO** different locations:

1. **Local `.env` file** - For Bolt development environment
2. **Supabase Secrets** - For Edge Functions (webhooks)

## 📝 Step-by-Step Configuration

### Step 1: Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers → API Keys**
3. Copy these two keys:
   - **Secret key** (starts with `sk_test_` or `sk_live_`)
   - Save for next steps

### Step 2: Create a Webhook Endpoint in Stripe

1. Go to **Developers → Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Enter your webhook URL:
   ```
   https://ijekgmegdixbxzgwsenc.supabase.co/functions/v1/stripe-webhook
   ```
4. Select these events:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`

5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

### Step 3: Configure Local Environment (.env file)

Edit your `.env` file and add:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

**Example:**
```bash
STRIPE_SECRET_KEY=sk_test_51Abc123XYZ...
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### Step 4: Configure Supabase Secrets

Open your terminal and run these commands:

```bash
# Login to Supabase (if not already logged in)
npx supabase login

# Link to your project
npx supabase link --project-ref ijekgmegdixbxzgwsenc

# Set the secrets
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

**OR** use the Supabase Dashboard:

1. Go to your Supabase project: https://supabase.com/dashboard/project/ijekgmegdixbxzgwsenc
2. Navigate to **Project Settings → Edge Functions**
3. Scroll to **Secrets**
4. Add two secrets:
   - Name: `STRIPE_SECRET_KEY`, Value: `sk_test_...`
   - Name: `STRIPE_WEBHOOK_SECRET`, Value: `whsec_...`

### Step 5: Restart Development Server

After adding the variables to `.env`, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then start it again
npm run dev
```

## ✅ Verification Checklist

- [ ] Created webhook endpoint in Stripe Dashboard
- [ ] Copied Secret Key from Stripe
- [ ] Copied Webhook Secret from Stripe
- [ ] Added both keys to `.env` file
- [ ] Added both keys to Supabase Secrets
- [ ] Restarted development server
- [ ] No "Missing secrets" error in Bolt

## 🧪 Testing the Setup

### Test Locally

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Login to Stripe:
   ```bash
   stripe login
   ```

3. Forward webhooks to your Supabase endpoint:
   ```bash
   stripe listen --forward-to https://ijekgmegdixbxzgwsenc.supabase.co/functions/v1/stripe-webhook
   ```

4. Trigger a test event:
   ```bash
   stripe trigger checkout.session.completed
   ```

5. Check Supabase logs:
   - Go to Supabase Dashboard → Edge Functions → stripe-webhook
   - View recent invocations

### Test with Real Checkout

1. Use Stripe test mode (`sk_test_...` keys)
2. Create a test checkout session
3. Use test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. Complete payment
7. Check webhook logs in Stripe Dashboard

## 🔍 Troubleshooting

### "Missing secrets" error in Bolt

**Solution:** Make sure `.env` file contains:
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
Then restart development server.

### Webhook returns 401 Unauthorized

**Cause:** Webhook secret not configured in Supabase

**Solution:** Run:
```bash
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### Webhook returns 400 Bad Request

**Cause:** Invalid webhook signature

**Solution:** Verify the webhook secret in Stripe Dashboard matches Supabase secret

### Payment successful but no queue item created

**Cause:** Missing metadata in checkout session

**Solution:** Include metadata when creating checkout session:
```javascript
const session = await stripe.checkout.sessions.create({
  // ... other params
  metadata: {
    user_id: 'user-uuid',
    plan_id: 'basic_10s',
    media_url: 'https://storage.url/video.mp4',
    title: 'My Content'
  }
});
```

## 📚 Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

## 🔐 Security Notes

- **Never commit** `.env` file to git (already in `.gitignore`)
- **Use test keys** (`sk_test_...`) during development
- **Use live keys** (`sk_live_...`) only in production
- **Rotate keys** if accidentally exposed
- **Verify webhook signatures** (already implemented)

## 📞 Need Help?

If you're still seeing the "Missing secrets" error:

1. Double-check `.env` file has the correct format
2. Ensure there are no extra spaces or quotes
3. Restart your development server
4. Clear browser cache and reload
5. Check terminal for any error messages
