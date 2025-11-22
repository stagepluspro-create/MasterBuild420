/*
  # Add Subscription Changes Tracking Table
  
  ## Summary
  Creates a table to track all subscription changes (upgrades, downgrades, cancellations).
  
  ## New Tables
  - `subscription_changes` - Historical log of subscription modifications
    - `id` (uuid, PK) - Unique identifier
    - `user_id` (uuid, FK) - References profiles(id)
    - `from_tier` (text, nullable) - Previous tier (null for initial subscription)
    - `to_tier` (text) - New tier
    - `reason` (text) - Reason for change
    - `paypal_transaction_id` (text, nullable) - Associated PayPal transaction
    - `created_at` (timestamptz) - Timestamp of change
  
  ## Security
  - RLS enabled
  - Users can only view their own subscription changes
  - Users can insert their own subscription changes
*/

CREATE TABLE IF NOT EXISTS subscription_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_tier text,
  to_tier text NOT NULL,
  reason text NOT NULL,
  paypal_transaction_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription changes"
  ON subscription_changes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create subscription changes"
  ON subscription_changes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_subscription_changes_user_id ON subscription_changes(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_changes_created_at ON subscription_changes(created_at DESC);
