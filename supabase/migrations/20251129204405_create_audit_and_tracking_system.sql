/*
  # Sistema Completo de Auditoría y Tracking

  ## 1. Nueva Tabla: audit_logs
  
  Tabla centralizada para registrar TODAS las acciones importantes del sistema:
  - Uploads de contenido (con metadata del archivo)
  - Creación de pagos en Stripe
  - Procesamiento de webhooks
  - Activación de contenido
  - Errores y fallos
  - Acciones administrativas
  
  **Columnas:**
  - `id` (uuid): Identificador único
  - `event_type` (text): Tipo de evento (upload, payment, webhook, activation, error, admin_action)
  - `user_email` (text): Email del usuario que realizó la acción
  - `related_id` (uuid): ID relacionado (queue_item_id, payment_id, order_id, etc)
  - `related_type` (text): Tipo de entidad relacionada
  - `metadata` (jsonb): Datos adicionales del evento
  - `success` (boolean): Si la acción fue exitosa
  - `error_message` (text): Mensaje de error si falló
  - `ip_address` (text): IP del usuario
  - `user_agent` (text): User agent
  - `created_at` (timestamp): Cuándo ocurrió

  ## 2. Nueva Tabla: payment_content_tracking
  
  Tabla para hacer match entre pagos de Stripe y contenido subido:
  - Permite detectar pagos huérfanos (sin contenido)
  - Permite detectar contenido huérfano (sin pago)
  - Tracking del ciclo completo: upload → payment → activation
  
  **Columnas:**
  - `id` (uuid): Identificador único
  - `stripe_payment_intent_id` (text): Payment intent de Stripe
  - `stripe_session_id` (text): Checkout session de Stripe
  - `stripe_customer_id` (text): Customer ID de Stripe
  - `customer_email` (text): Email del cliente
  - `customer_name` (text): Nombre del cliente
  - `amount_cents` (integer): Monto pagado en centavos
  - `plan_id` (text): ID del plan comprado
  - `queue_item_id` (uuid): ID del queue_item original
  - `content_uploaded` (boolean): Si el contenido fue subido
  - `payment_received` (boolean): Si el pago fue recibido
  - `webhook_processed` (boolean): Si el webhook procesó correctamente
  - `content_activated` (boolean): Si el contenido fue activado
  - `activation_failed_reason` (text): Razón si falló la activación
  - `upload_timestamp` (timestamp): Cuándo se subió el contenido
  - `payment_timestamp` (timestamp): Cuándo se recibió el pago
  - `activation_timestamp` (timestamp): Cuándo se activó el contenido
  - `created_at` (timestamp): Cuándo se creó el registro
  - `updated_at` (timestamp): Última actualización

  ## 3. Función: find_orphaned_payments
  
  Función para detectar pagos sin contenido activo

  ## 4. Security
  
  - RLS habilitado en ambas tablas
  - Solo admins pueden leer audit_logs
  - Solo admins pueden leer payment_content_tracking
*/

-- Crear tabla de audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN (
    'content_upload',
    'payment_initiated', 
    'payment_completed',
    'webhook_received',
    'webhook_processed',
    'content_activated',
    'content_deleted',
    'error',
    'admin_action'
  )),
  user_email text,
  related_id uuid,
  related_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  success boolean DEFAULT true,
  error_message text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_related_id ON audit_logs(related_id);

-- Crear tabla de tracking de pagos y contenido
CREATE TABLE IF NOT EXISTS payment_content_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_payment_intent_id text UNIQUE,
  stripe_session_id text,
  stripe_customer_id text,
  customer_email text NOT NULL,
  customer_name text,
  amount_cents integer NOT NULL,
  plan_id text,
  queue_item_id uuid,
  content_uploaded boolean DEFAULT false,
  payment_received boolean DEFAULT false,
  webhook_processed boolean DEFAULT false,
  content_activated boolean DEFAULT false,
  activation_failed_reason text,
  upload_timestamp timestamptz,
  payment_timestamp timestamptz,
  activation_timestamp timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear índices para tracking
CREATE INDEX IF NOT EXISTS idx_tracking_payment_intent ON payment_content_tracking(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_tracking_session ON payment_content_tracking(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_tracking_email ON payment_content_tracking(customer_email);
CREATE INDEX IF NOT EXISTS idx_tracking_queue_item ON payment_content_tracking(queue_item_id);
CREATE INDEX IF NOT EXISTS idx_tracking_orphaned ON payment_content_tracking(payment_received, content_activated) 
  WHERE payment_received = true AND content_activated = false;

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_tracking_timestamp
  BEFORE UPDATE ON payment_content_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_tracking_updated_at();

-- Función para encontrar pagos huérfanos
CREATE OR REPLACE FUNCTION find_orphaned_payments()
RETURNS TABLE (
  tracking_id uuid,
  customer_email text,
  customer_name text,
  amount_cents integer,
  payment_intent_id text,
  session_id text,
  payment_timestamp timestamptz,
  hours_since_payment numeric,
  failure_reason text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pct.id,
    pct.customer_email,
    pct.customer_name,
    pct.amount_cents,
    pct.stripe_payment_intent_id,
    pct.stripe_session_id,
    pct.payment_timestamp,
    EXTRACT(EPOCH FROM (now() - pct.payment_timestamp)) / 3600 as hours_since_payment,
    pct.activation_failed_reason
  FROM payment_content_tracking pct
  WHERE pct.payment_received = true 
    AND pct.content_activated = false
    AND pct.payment_timestamp IS NOT NULL
  ORDER BY pct.payment_timestamp DESC;
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_content_tracking ENABLE ROW LEVEL SECURITY;

-- Políticas: Solo admins pueden ver logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND 'admin' = ANY(users.roles)
    )
  );

CREATE POLICY "System can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view payment tracking"
  ON payment_content_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND 'admin' = ANY(users.roles)
    )
  );

CREATE POLICY "System can insert payment tracking"
  ON payment_content_tracking FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update payment tracking"
  ON payment_content_tracking FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Crear vista para admin dashboard
CREATE OR REPLACE VIEW admin_content_overview AS
SELECT 
  qi.id,
  qi.title,
  qi.media_type,
  qi.status,
  qi.order_index,
  qi.created_at,
  qi.scheduled_start,
  qi.scheduled_end,
  qi.published_at,
  qi.metadata->>'customer_email' as customer_email,
  qi.metadata->>'customer_name' as customer_name,
  qi.metadata->>'stripe_customer_id' as stripe_customer_id,
  qi.metadata->>'payment_date' as payment_date,
  qi.metadata->>'payment_status' as payment_status,
  qi.metadata->>'payment_confirmed' as payment_confirmed,
  qi.metadata->>'price_cents' as price_cents,
  qi.metadata->>'stripe_session_id' as stripe_session_id,
  qi.metadata->>'display_status' as display_status,
  qi.metadata->>'moderation_status' as moderation_status,
  qi.metadata->>'is_admin_content' as is_admin_content,
  qi.metadata->>'auto_scheduled_slot' as slot_number,
  qi.metadata->>'slot_type' as slot_type,
  CASE 
    WHEN qi.metadata->>'is_admin_content' = 'true' THEN 'Admin Content'
    WHEN qi.metadata->>'payment_confirmed' = 'true' THEN 'Paid Customer'
    ELSE 'Unpaid/Pending'
  END as content_source,
  CASE 
    WHEN qi.scheduled_start IS NULL THEN 'Immediate'
    WHEN qi.scheduled_start > now() THEN 'Scheduled Future'
    ELSE 'Playing Now'
  END as play_status
FROM queue_items qi
ORDER BY qi.order_index;

-- Grant access a la vista
GRANT SELECT ON admin_content_overview TO authenticated;
