# Stripe Integration Fix - Real Price IDs

## Problem

After implementing Supabase services, the upload flow was failing with "Upload Failed - There was an error processing your request." The Edge Function was creating dynamic Stripe products instead of using pre-configured Stripe Price IDs.

## Root Cause

1. Edge Function was creating price_data dynamically instead of using existing Stripe Price IDs
2. Frontend was not passing the Stripe Price ID to the Edge Function
3. No mapping between plan IDs and Stripe Price IDs in the checkout flow

## Solution

Integrated real Stripe Price IDs from the plans configuration into the checkout flow.

### Changes Made

#### 1. Updated Stripe Edge Function

**File:** `supabase/functions/stripe-checkout/index.ts`

**Added Price ID Mapping:**
```typescript
const STRIPE_PRICE_IDS: Record<string, string> = {
  'photo-logo': 'price_1S8tkJF6Bz1PoBh55VqRIrC3',
  'photo-border-logo': 'price_1S8tn8F6Bz1PoBh5nT9k1JT3',
  'photo-clean': 'price_1S8tpmF6Bz1PoBh5FA5LLqTK',
  'video-logo': 'price_1S8tqdF6Bz1PoBh5PKK3WZe9',
  'video-border-logo': 'price_1S8trAF6Bz1PoBh5S1knkYcR',
  'video-clean': 'price_1S8treF6Bz1PoBh59KkmfJiu',
};
```

**Updated Request Handling:**
```typescript
// Accept stripe_price_id from frontend or fallback to mapping
const { order_id, plan_id, user_email, stripe_price_id } = await req.json();
const priceId = stripe_price_id || STRIPE_PRICE_IDS[plan_id];

// Use price ID directly instead of creating product dynamically
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [
    {
      price: priceId,  // Use existing Stripe Price
      quantity: 1,
    },
  ],
  mode: 'payment',
  // ... rest of config
});
```

**Benefits:**
- ✅ Uses real Stripe products and prices
- ✅ Proper tax calculation and reporting
- ✅ Consistent product names in Stripe Dashboard
- ✅ Better analytics and revenue tracking

#### 2. Updated Payment Service

**File:** `src/services/supabasePaymentService.ts`

**Added stripePriceId to Input:**
```typescript
export interface CreateCheckoutSessionInput {
  orderId: string;
  planId: string;
  stripePriceId: string;  // NEW: Pass Stripe Price ID
  userEmail: string;
  mediaUrl: string;
  title: string;
}
```

**Pass to Edge Function:**
```typescript
body: JSON.stringify({
  order_id: input.orderId,
  plan_id: input.planId,
  stripe_price_id: input.stripePriceId,  // NEW
  user_email: input.userEmail,
  media_url: input.mediaUrl,
  title: input.title,
}),
```

#### 3. Updated ContentUpload Component

**File:** `src/pages/ContentUpload.tsx`

**Get Stripe Price ID from Plan:**
```typescript
const stripePriceId = planService.getStripePriceId(selectedPlan);
if (!stripePriceId) {
  throw new Error(`No Stripe Price ID found for plan: ${selectedPlan}`);
}

const checkoutData = await supabasePaymentService.createCheckoutSession({
  orderId: order.id,
  planId: selectedPlan,
  stripePriceId,  // Pass Stripe Price ID
  userEmail: "guest@showyo.app",
  mediaUrl: uploadResult.url,
  title: processedFile.name,
});
```

## Stripe Price IDs

All prices are configured in `shared/plans.ts`:

| Plan ID | Price | Stripe Price ID |
|---------|-------|-----------------|
| `photo-logo` | $10 | `price_1S8tkJF6Bz1PoBh55VqRIrC3` |
| `photo-border-logo` | $15 | `price_1S8tn8F6Bz1PoBh5nT9k1JT3` |
| `photo-clean` | $15 | `price_1S8tpmF6Bz1PoBh5FA5LLqTK` |
| `video-logo` | $20 | `price_1S8tqdF6Bz1PoBh5PKK3WZe9` |
| `video-border-logo` | $25 | `price_1S8trAF6Bz1PoBh5S1knkYcR` |
| `video-clean` | $30 | `price_1S8treF6Bz1PoBh59KkmfJiu` |

## Flow

```
1. User selects plan → planService.getPlan(planId)
         ↓
2. Get Stripe Price ID → planService.getStripePriceId(planId)
         ↓
3. Create order → supabaseOrderService.createOrder()
         ↓
4. Create checkout → supabasePaymentService.createCheckoutSession({
                       orderId, planId, stripePriceId, ...
                     })
         ↓
5. Edge Function → stripe.checkout.sessions.create({
                     line_items: [{ price: stripePriceId, quantity: 1 }]
                   })
         ↓
6. User pays → Stripe Checkout (real products/prices)
         ↓
7. Webhook → Updates order status
```

## Testing

### 1. Verify Plan Configuration

```typescript
import { planService } from '@/domain/services/planService';

const plan = planService.getPlan('photo-clean');
console.log(plan.stripePriceId); // price_1S8tpmF6Bz1PoBh5FA5LLqTK
```

### 2. Test Checkout Session Creation

1. Go to `/upload`
2. Upload image
3. Select "Clean Photo" plan ($15)
4. Click "Apply Changes" in editor
5. Click "Pay & Upload Content"

**Expected:**
- ✅ Order created in `queue_items`
- ✅ Stripe Checkout opens
- ✅ Shows "Clean Photo" product
- ✅ Price shows $15.00
- ✅ No errors in console

### 3. Check Stripe Dashboard

After creating checkout session:

1. Go to Stripe Dashboard → Payments → Checkout Sessions
2. Find most recent session
3. Verify:
   - ✅ Product matches plan selected
   - ✅ Price is correct
   - ✅ Metadata includes `order_id`, `plan_id`, `user_email`

### 4. Complete Payment

Use Stripe test cards:
- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires Auth:** `4000 0025 0000 3155`

**After successful payment:**
- ✅ Webhook triggers
- ✅ Order status → `completed`
- ✅ Content appears in admin queue

## Error Handling

### "No Stripe Price ID found for plan"

**Cause:** Plan ID doesn't exist or missing stripePriceId in `shared/plans.ts`

**Solution:**
1. Check plan ID is correct
2. Verify `stripePriceId` field in plan definition
3. Update `STRIPE_PRICE_IDS` mapping in Edge Function

### "Invalid plan: {plan_id}. No Stripe Price ID found"

**Cause:** Edge Function can't find Price ID for the plan

**Solution:**
1. Verify Price ID exists in Stripe Dashboard
2. Check `STRIPE_PRICE_IDS` mapping in Edge Function
3. Ensure Price ID matches exactly (including test/live mode)

### "Failed to create checkout session"

**Possible Causes:**
1. Stripe secret key not configured
2. Invalid Price ID
3. Price ID is archived or deleted in Stripe

**Solution:**
1. Check Supabase secrets: `STRIPE_SECRET_KEY`
2. Verify Price IDs in Stripe Dashboard
3. Check Edge Function logs for details

## Stripe Configuration

### Required Secrets

Set in Supabase Dashboard → Settings → Edge Functions → Secrets:

```bash
STRIPE_SECRET_KEY=sk_test_...  # Test mode
# OR
STRIPE_SECRET_KEY=sk_live_...  # Production
```

### Creating New Products/Prices

If you need to add new plans:

1. **Create Product in Stripe:**
   ```
   Dashboard → Products → Add Product
   Name: Photo with Logo
   Price: $10.00 USD
   ```

2. **Copy Price ID:**
   ```
   price_1S8tkJF6Bz1PoBh55VqRIrC3
   ```

3. **Add to plans.ts:**
   ```typescript
   {
     id: "photo-logo",
     title: "Photo with Logo",
     price: 10,
     stripePriceId: "price_1S8tkJF6Bz1PoBh55VqRIrC3",
     // ... rest of config
   }
   ```

4. **Update Edge Function:**
   ```typescript
   const STRIPE_PRICE_IDS: Record<string, string> = {
     'photo-logo': 'price_1S8tkJF6Bz1PoBh55VqRIrC3',
     // ... rest
   };
   ```

5. **Deploy:**
   ```bash
   # Edge Function deployed automatically via MCP tool
   npm run build
   ```

## Webhook Handling

The `stripe-webhook` Edge Function handles payment completion:

**Relevant Events:**
- `checkout.session.completed` - Payment succeeded
- `checkout.session.async_payment_succeeded` - Async payment completed
- `checkout.session.async_payment_failed` - Payment failed

**Webhook updates order:**
```typescript
// When payment succeeds
UPDATE queue_items
SET status = 'completed',
    moderation_status = 'pending'
WHERE id = metadata.order_id
```

## Deployment Status

- ✅ Edge Function deployed
- ✅ Stripe Price IDs configured
- ✅ Frontend updated
- ✅ Build successful (12.53s)
- ✅ Ready for testing

## Next Steps

1. **Test with Test Keys:**
   - Use Stripe test mode
   - Test all 6 plan checkout flows
   - Verify webhook handling

2. **Production Deployment:**
   - Update `STRIPE_SECRET_KEY` to live key
   - Update `STRIPE_WEBHOOK_SECRET` to live webhook secret
   - Update Price IDs to production Price IDs

3. **Monitor:**
   - Supabase Edge Function logs
   - Stripe Dashboard → Payments
   - Database → queue_items table

## Related Files

- ✅ `supabase/functions/stripe-checkout/index.ts` - Updated
- ✅ `src/services/supabasePaymentService.ts` - Updated
- ✅ `src/pages/ContentUpload.tsx` - Updated
- ✅ `shared/plans.ts` - Contains all Price IDs
- ⚠️ `supabase/functions/stripe-webhook/index.ts` - Verify handles new flow

## Important Notes

1. **Price IDs are mode-specific:** Test mode Price IDs (starting with `price_test_`) only work with test keys. Production Price IDs work with live keys.

2. **Webhook Secret:** Make sure webhook secret matches the endpoint registered in Stripe Dashboard.

3. **CORS:** Edge Function has CORS enabled for all origins (`*`). Restrict in production if needed.

4. **Error Details:** Edge Function returns full error stack in development. Consider removing `details` field in production.

## Build Status

✅ **Build Successful** (12.53s)
- No compilation errors
- All TypeScript types resolved
- Ready for deployment

The Stripe integration is now complete and uses real Stripe products with proper Price IDs!
