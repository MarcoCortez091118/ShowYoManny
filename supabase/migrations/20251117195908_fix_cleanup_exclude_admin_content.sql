/*
  # Fix cleanup function to exclude admin content
  
  1. Purpose
    - Update cleanup_unpaid_content() to NEVER delete admin content
    - Admin content should persist regardless of payment status
    - Only delete user-uploaded content that was never paid for
  
  2. Changes
    - Add filter to exclude content where metadata->>'is_admin_content' = 'true'
    - Only delete pending user content older than 5 minutes
    - Preserve all admin content forever
  
  3. Critical Fix
    - This prevents accidentally deleting admin-managed billboard content
    - Admin content is managed separately and should not be subject to auto-cleanup
*/

-- Drop and recreate the function with admin content exclusion
DROP FUNCTION IF EXISTS cleanup_unpaid_content();

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
  -- Find all pending items older than 5 minutes
  -- EXCLUDE admin content (is_admin_content = true)
  FOR item_record IN
    SELECT id, media_url, metadata
    FROM queue_items
    WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '5 minutes'
    AND (metadata->>'is_admin_content')::boolean IS NOT TRUE
  LOOP
    -- Delete the file from storage
    BEGIN
      -- Extract the file path from the URL
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_unpaid_content() TO authenticated, anon, service_role;

COMMENT ON FUNCTION cleanup_unpaid_content() IS 'Deletes unpaid USER content older than 5 minutes. NEVER deletes admin content.';