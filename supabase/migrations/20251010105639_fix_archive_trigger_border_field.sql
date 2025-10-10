/*
  # Fix Archive Trigger - Border Field Name

  1. Changes
    - Update archive_queue_item_before_delete function
    - Change OLD.border_style to OLD.border_id
    - Match actual column name in queue_items table
  
  2. Why
    - Trigger was failing because border_style doesn't exist
    - The actual column is border_id
    - This was causing delete operations to fail
*/

-- Drop and recreate the function with correct field name
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
    OLD.border_id,  -- Changed from OLD.border_style to OLD.border_id
    OLD.scheduled_start,
    OLD.scheduled_end,
    OLD.published_at,
    now(),
    OLD.status,
    OLD.created_at
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;