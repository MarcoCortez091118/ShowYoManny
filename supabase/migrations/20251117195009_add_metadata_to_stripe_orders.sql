/*
  # Add metadata field to stripe_orders table
  
  1. Changes
    - Add `metadata` jsonb column to `stripe_orders` table to store order metadata
    - This field stores customer details and order information from Stripe checkout
  
  2. Notes
    - Metadata includes customer_email, customer_name, customer_phone, and order_id
    - This is required for the webhook to function correctly
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_orders' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE stripe_orders ADD COLUMN metadata jsonb;
  END IF;
END $$;