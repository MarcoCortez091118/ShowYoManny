/*
  # Create Auto-Delete Function for Expired Queue Items

  This migration creates a database function that automatically deletes expired queue items
  that are older than 24 hours after their scheduled_end date.

  ## What it does
  1. Creates a function `auto_delete_expired_content()` that:
     - Finds all queue_items where scheduled_end is more than 24 hours ago
     - Deletes these items from the queue_items table
     - Returns the number of deleted items

  ## Security
  - Function is SECURITY DEFINER (runs with creator privileges)
  - Only accessible by authenticated users
  - Safe for use with Edge Functions via service role key

  ## Usage
  Can be called manually or automatically via Edge Function:
  ```sql
  SELECT auto_delete_expired_content();
  ```
*/

-- Drop the function if it exists
DROP FUNCTION IF EXISTS auto_delete_expired_content();

-- Create function to delete expired queue items after 24 hours
CREATE OR REPLACE FUNCTION auto_delete_expired_content()
RETURNS TABLE (deleted_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete queue items where scheduled_end is more than 24 hours ago
  WITH deleted AS (
    DELETE FROM queue_items
    WHERE 
      scheduled_end IS NOT NULL 
      AND scheduled_end < (NOW() - INTERVAL '24 hours')
    RETURNING id
  )
  SELECT COUNT(*)::INTEGER INTO v_deleted_count FROM deleted;

  -- Log the cleanup
  RAISE NOTICE 'Auto-deleted % expired queue items', v_deleted_count;

  -- Return the count
  RETURN QUERY SELECT v_deleted_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION auto_delete_expired_content() TO authenticated;

-- Grant execute permission to service role (for Edge Functions)
GRANT EXECUTE ON FUNCTION auto_delete_expired_content() TO service_role;