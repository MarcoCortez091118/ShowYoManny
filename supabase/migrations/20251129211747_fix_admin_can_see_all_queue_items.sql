/*
  # Fix Admin Access to All Queue Items
  
  1. Problem
    - Current RLS only allows users to see items where `user_id = auth.uid()`
    - Paid user content has `user_id = NULL`
    - Admins cannot see scheduled paid content
  
  2. Solution
    - Add policy for admins to read ALL queue items regardless of user_id
    - Keep existing user policy for non-admins
  
  3. Security
    - Only users with 'admin' role can see all content
    - Regular users still only see their own content
*/

-- Drop existing read policy
DROP POLICY IF EXISTS "Users can read own queue items" ON queue_items;

-- Recreate with admin access
CREATE POLICY "Users can read own queue items"
  ON queue_items
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    -- Allow admins to read ALL content
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND 'admin' = ANY(users.roles)
    )
  );
