CREATE TABLE IF NOT EXISTS pending_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  send_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  error_message text
);

ALTER TABLE pending_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_access" ON pending_notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_pending_notifications_status_send_at 
  ON pending_notifications (status, send_at) 
  WHERE status = 'pending';
