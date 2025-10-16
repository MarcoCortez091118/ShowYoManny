/*
  # Add Auto-Delete Timestamp to Content History

  1. Changes
    - Add `auto_delete_at` field to `content_history` table
    - Set to 24 hours after deletion by default
    - Update archive trigger to set auto_delete_at
    - Create function to automatically delete old history records
    - Create index for performance

  2. Why
    - Keep deleted/expired items in history for 24 hours
    - Automatically clean up old records after 24 hours
    - Allow users to see recently deleted content
    - Prevent database bloat from old history records

  3. Security
    - No policy changes needed
    - Deletion function uses SECURITY DEFINER
*/

-- Add auto_delete_at field to content_history
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_history' AND column_name = 'auto_delete_at'
  ) THEN
    ALTER TABLE content_history ADD COLUMN auto_delete_at timestamptz;
  END IF;
END $$;

-- Set auto_delete_at for existing records (24 hours from now)
UPDATE content_history 
SET auto_delete_at = deleted_at + interval '24 hours'
WHERE auto_delete_at IS NULL AND deleted_at IS NOT NULL;

-- Update archive function to set auto_delete_at
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
    auto_delete_at,
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
    OLD.border_id,
    OLD.scheduled_start,
    OLD.scheduled_end,
    OLD.published_at,
    now(),
    now() + interval '24 hours',  -- Auto-delete after 24 hours
    OLD.status,
    OLD.created_at
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically delete old history records
CREATE OR REPLACE FUNCTION auto_delete_old_history()
RETURNS void AS $$
BEGIN
  DELETE FROM content_history
  WHERE auto_delete_at IS NOT NULL
    AND auto_delete_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for performance on auto_delete_at lookups
CREATE INDEX IF NOT EXISTS idx_content_history_auto_delete_at 
  ON content_history(auto_delete_at) 
  WHERE auto_delete_at IS NOT NULL;

-- Create index for deleted_at for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_content_history_deleted_at 
  ON content_history(deleted_at DESC);