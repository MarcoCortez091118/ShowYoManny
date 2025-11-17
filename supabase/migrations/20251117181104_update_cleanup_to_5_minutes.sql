/*
  # Update cleanup time to 5 minutes (immediate cleanup)

  ## Purpose
  Change the cleanup period from 2 hours to 5 minutes for unpaid content.
  This prevents storing files that users abandoned and will never pay for.

  ## Changes
  - Update cleanup_unpaid_content() function to delete content older than 5 minutes
  - More aggressive cleanup to save storage costs
  - Users have 5 minutes to complete payment (typical Stripe checkout time)

  ## Notes
  - 5 minutes is more than enough time for a user to complete Stripe checkout
  - If user closes browser/abandons payment, file is removed quickly
  - Reduces storage costs significantly
*/

-- Drop existing function
DROP FUNCTION IF EXISTS cleanup_unpaid_content();

-- Create updated function with 5 minute threshold
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
  FOR item_record IN
    SELECT id, media_url
    FROM queue_items
    WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '5 minutes'
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

COMMENT ON FUNCTION cleanup_unpaid_content() IS 'Deletes unpaid content older than 5 minutes to save storage costs';