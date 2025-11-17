/*
  # Add automatic cleanup for unpaid content

  ## Purpose
  Automatically delete content that was uploaded but never paid for after 2 hours.

  ## Changes
  1. Create function to identify unpaid content (status=pending and older than 2 hours)
  2. Create function to delete unpaid content and their files from storage
  3. This will be called by a scheduled edge function

  ## Notes
  - Only deletes content that has been in 'pending' status for more than 2 hours
  - Also removes the associated files from storage
  - Active content (after payment) is never deleted
*/

-- Function to delete unpaid content older than 2 hours
CREATE OR REPLACE FUNCTION cleanup_unpaid_content()
RETURNS TABLE (
  deleted_count integer,
  deleted_ids uuid[]
) AS $$
DECLARE
  item_record RECORD;
  deleted_items uuid[] := '{}';
  delete_count integer := 0;
BEGIN
  -- Find all pending items older than 2 hours
  FOR item_record IN
    SELECT id, media_url
    FROM queue_items
    WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '2 hours'
  LOOP
    -- Delete the file from storage
    -- Note: This requires the storage.objects table
    BEGIN
      -- Extract the file path from the URL
      -- Format: https://<project>.supabase.co/storage/v1/object/public/content/<filename>
      DELETE FROM storage.objects
      WHERE bucket_id = 'content'
      AND name = SUBSTRING(item_record.media_url FROM 'content/(.+)$');
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue with queue item deletion
      RAISE NOTICE 'Failed to delete storage file for item %: %', item_record.id, SQLERRM;
    END;

    -- Delete the queue item
    DELETE FROM queue_items WHERE id = item_record.id;
    
    deleted_items := array_append(deleted_items, item_record.id);
    delete_count := delete_count + 1;
  END LOOP;

  RETURN QUERY SELECT delete_count, deleted_items;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (will be called by edge function)
GRANT EXECUTE ON FUNCTION cleanup_unpaid_content() TO authenticated, anon, service_role;