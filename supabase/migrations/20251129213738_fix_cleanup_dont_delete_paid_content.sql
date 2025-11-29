/*
  # Fix Cleanup - Don't Delete Paid Content
  
  1. Problem
    - cleanup_unpaid_content() deletes ALL pending items after 5 minutes
    - It doesn't check if payment was completed
    - Paid content with status='pending' gets deleted incorrectly
  
  2. Solution
    - Only delete pending items that are truly unpaid
    - Check metadata for payment_status and payment_confirmed
    - Preserve all paid content regardless of status
  
  3. Changes
    - Update cleanup function to check metadata before deletion
    - Add additional safety checks for paid content
*/

-- Drop existing function
DROP FUNCTION IF EXISTS cleanup_unpaid_content();

-- Create updated function that respects paid content
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
  -- Find all pending items older than 5 minutes that are NOT paid
  FOR item_record IN
    SELECT id, media_url, metadata
    FROM queue_items
    WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '5 minutes'
    -- CRITICAL: Only delete if NOT paid
    AND (
      metadata->>'payment_status' IS NULL 
      OR metadata->>'payment_status' != 'confirmed'
    )
    AND (
      metadata->>'payment_confirmed' IS NULL
      OR metadata->>'payment_confirmed' != 'true'
    )
    AND (
      metadata->>'is_admin_content' IS NULL
      OR metadata->>'is_admin_content' != 'true'
    )
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

COMMENT ON FUNCTION cleanup_unpaid_content() IS 'Deletes ONLY unpaid content older than 5 minutes. Preserves paid content and admin content.';
