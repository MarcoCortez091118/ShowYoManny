/*
  # Fix cleanup function to use correct bucket name
  
  1. Purpose
    - Fix the bucket_id from 'content' to 'media'
    - The actual bucket name in storage is 'media', not 'content'
    - This was preventing file deletion from working correctly
  
  2. Changes
    - Update cleanup_unpaid_content() to use bucket_id = 'media'
    - Keep all other protections (admin content exclusion)
*/

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
    -- Delete the file from storage (using correct bucket: 'media')
    BEGIN
      -- Extract the file path from the URL
      DELETE FROM storage.objects
      WHERE bucket_id = 'media'
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

COMMENT ON FUNCTION cleanup_unpaid_content() IS 'Deletes unpaid USER content older than 5 minutes from media bucket. NEVER deletes admin content.';