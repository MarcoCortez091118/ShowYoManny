/*
  # Add Content Scheduling and Expiration Fields
  
  1. New Fields in queue_items
    - `scheduled_end` (timestamptz) - When content should stop displaying
    - `auto_delete_on_expire` (boolean) - Auto-delete when expired
    - `published_at` (timestamptz) - When content actually started displaying
    
  2. Computed Status Logic
    - scheduled: Has scheduled_start in future
    - published: Currently displaying (between scheduled_start and scheduled_end)
    - expired: Past scheduled_end date
  
  3. New Table: content_history
    - Tracks all uploaded content
    - Preserves deleted content for history
    - Includes preview URL and metadata
  
  Notes:
    - Auto-deletion runs via trigger when content expires
    - History table maintains audit trail
*/

-- Add scheduling fields to queue_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_items' AND column_name = 'scheduled_end'
  ) THEN
    ALTER TABLE queue_items ADD COLUMN scheduled_end timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_items' AND column_name = 'auto_delete_on_expire'
  ) THEN
    ALTER TABLE queue_items ADD COLUMN auto_delete_on_expire boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_items' AND column_name = 'published_at'
  ) THEN
    ALTER TABLE queue_items ADD COLUMN published_at timestamptz;
  END IF;
END $$;

-- Create content_history table
CREATE TABLE IF NOT EXISTS content_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kiosk_id uuid REFERENCES kiosks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  
  title text,
  media_type text NOT NULL,
  media_url text NOT NULL,
  thumbnail_url text,
  
  duration integer NOT NULL,
  border_style text DEFAULT 'none',
  
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  published_at timestamptz,
  deleted_at timestamptz,
  
  status_at_deletion text,
  reason text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on content_history
ALTER TABLE content_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own history
CREATE POLICY "Users can view own content history"
ON content_history
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: System can insert into history (via trigger)
CREATE POLICY "System can insert content history"
ON content_history
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Function to archive content before deletion
CREATE OR REPLACE FUNCTION archive_queue_item_before_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO content_history (
    kiosk_id,
    user_id,
    title,
    media_type,
    media_url,
    thumbnail_url,
    duration,
    border_style,
    scheduled_start,
    scheduled_end,
    published_at,
    deleted_at,
    status_at_deletion,
    created_at
  ) VALUES (
    OLD.kiosk_id,
    OLD.user_id,
    OLD.title,
    OLD.media_type,
    OLD.media_url,
    OLD.media_url,
    OLD.duration,
    OLD.border_style,
    OLD.scheduled_start,
    OLD.scheduled_end,
    OLD.published_at,
    now(),
    OLD.status,
    OLD.created_at
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to archive before deletion
DROP TRIGGER IF EXISTS archive_before_delete_trigger ON queue_items;
CREATE TRIGGER archive_before_delete_trigger
  BEFORE DELETE ON queue_items
  FOR EACH ROW
  EXECUTE FUNCTION archive_queue_item_before_delete();

-- Function to auto-delete expired content
CREATE OR REPLACE FUNCTION auto_delete_expired_content()
RETURNS void AS $$
BEGIN
  DELETE FROM queue_items
  WHERE auto_delete_on_expire = true
    AND scheduled_end IS NOT NULL
    AND scheduled_end < now()
    AND status = 'completed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_queue_items_scheduled_end 
  ON queue_items(scheduled_end) 
  WHERE scheduled_end IS NOT NULL;