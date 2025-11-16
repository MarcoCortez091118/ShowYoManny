/*
  # Create Customers Table for Marketing and Analytics

  ## Purpose
  This migration creates a comprehensive customers table to track all customer information
  for marketing campaigns, analytics, and customer lifetime value (CLV/LTV) calculations.

  ## New Tables
  - `customers`
    - `id` (uuid, primary key) - Unique customer identifier
    - `email` (text, unique, not null) - Customer email (primary identifier)
    - `name` (text) - Customer full name
    - `phone` (text) - Customer phone number
    - `stripe_customer_id` (text, unique) - Stripe customer ID
    - `total_purchases` (integer, default 0) - Count of completed purchases
    - `total_spent` (decimal, default 0) - Total amount spent (lifetime value)
    - `first_purchase_at` (timestamptz) - Date of first purchase
    - `last_purchase_at` (timestamptz) - Date of most recent purchase
    - `billing_address` (jsonb) - Billing address details
    - `metadata` (jsonb) - Additional customer data (preferences, source, etc)
    - `marketing_consent` (boolean, default false) - Email marketing permission
    - `customer_segment` (text, default 'new') - Customer classification (new, returning, vip)
    - `created_at` (timestamptz, default now()) - Record creation timestamp
    - `updated_at` (timestamptz, default now()) - Record update timestamp

  ## Security
  - Enable RLS on customers table
  - Admin-only access policies for customer data
  - Customers can view their own data only

  ## Indexes
  - Index on email for fast lookups
  - Index on stripe_customer_id for Stripe integration
  - Index on last_purchase_at for recency queries
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text,
  phone text,
  stripe_customer_id text UNIQUE,
  total_purchases integer DEFAULT 0,
  total_spent decimal(10, 2) DEFAULT 0.00,
  first_purchase_at timestamptz,
  last_purchase_at timestamptz,
  billing_address jsonb,
  metadata jsonb,
  marketing_consent boolean DEFAULT false,
  customer_segment text DEFAULT 'new' CHECK (customer_segment IN ('new', 'returning', 'vip', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_stripe_id ON customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_last_purchase ON customers(last_purchase_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(customer_segment);

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Admin can see all customers
CREATE POLICY "Admins can view all customers"
  ON customers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND 'admin' = ANY(users.roles)
    )
  );

-- Admin can insert customers
CREATE POLICY "Admins can insert customers"
  ON customers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND 'admin' = ANY(users.roles)
    )
  );

-- Admin can update customers
CREATE POLICY "Admins can update customers"
  ON customers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND 'admin' = ANY(users.roles)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND 'admin' = ANY(users.roles)
    )
  );

-- Function to update customer statistics after a purchase
CREATE OR REPLACE FUNCTION update_customer_stats_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
  -- Update customer statistics
  UPDATE customers
  SET 
    total_purchases = total_purchases + 1,
    total_spent = total_spent + (NEW.amount_total / 100.0), -- Stripe amounts are in cents
    last_purchase_at = now(),
    first_purchase_at = COALESCE(first_purchase_at, now()),
    customer_segment = CASE
      WHEN total_purchases + 1 >= 5 THEN 'vip'
      WHEN total_purchases + 1 >= 2 THEN 'returning'
      ELSE 'new'
    END,
    updated_at = now()
  WHERE stripe_customer_id = NEW.customer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update customer stats when an order completes
CREATE TRIGGER trigger_update_customer_stats
  AFTER INSERT ON stripe_orders
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_customer_stats_after_purchase();

-- Function to automatically create customer record from queue_item metadata
CREATE OR REPLACE FUNCTION create_customer_from_queue_item()
RETURNS TRIGGER AS $$
DECLARE
  customer_email text;
  customer_name text;
  stripe_cust_id text;
BEGIN
  -- Extract customer info from metadata
  customer_email := NEW.metadata->>'customer_email';
  customer_name := NEW.metadata->>'customer_name';
  stripe_cust_id := NEW.metadata->>'stripe_customer_id';

  -- Only process if we have customer data and it's a paid item
  IF customer_email IS NOT NULL AND NEW.status = 'active' THEN
    -- Insert or update customer record
    INSERT INTO customers (email, name, stripe_customer_id, metadata)
    VALUES (
      customer_email,
      customer_name,
      stripe_cust_id,
      jsonb_build_object(
        'source', 'billboard_upload',
        'first_content_type', NEW.media_type,
        'first_content_date', now()
      )
    )
    ON CONFLICT (email) DO UPDATE SET
      name = COALESCE(EXCLUDED.name, customers.name),
      stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, customers.stripe_customer_id),
      updated_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create customer from queue_item when activated
CREATE TRIGGER trigger_create_customer_from_queue
  AFTER UPDATE ON queue_items
  FOR EACH ROW
  WHEN (OLD.status != 'active' AND NEW.status = 'active')
  EXECUTE FUNCTION create_customer_from_queue_item();