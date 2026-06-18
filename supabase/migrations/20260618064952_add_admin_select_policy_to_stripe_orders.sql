CREATE POLICY "Admins can view all stripe orders"
  ON stripe_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND 'admin' = ANY(users.roles)
    )
  );