/*
  # Complete Admin Access to Queue Items
  
  1. Changes
    - Add admin access to UPDATE policy
    - Add admin access to DELETE policy
    - Admins can now manage ALL content (their own + paid user content)
  
  2. Security
    - Only users with 'admin' role get full access
    - Regular users still only manage their own content
*/

-- Update policy: Allow admins to update ALL content
DROP POLICY IF EXISTS "Users can update own queue items" ON queue_items;

CREATE POLICY "Users can update own queue items"
  ON queue_items
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND 'admin' = ANY(users.roles)
    )
  )
  WITH CHECK (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND 'admin' = ANY(users.roles)
    )
  );

-- Delete policy: Allow admins to delete ALL content
DROP POLICY IF EXISTS "Users can delete own queue items" ON queue_items;

CREATE POLICY "Users can delete own queue items"
  ON queue_items
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND 'admin' = ANY(users.roles)
    )
  );
