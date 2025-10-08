-- Clean up old content without file paths
DELETE FROM content_queue 
WHERE order_id IN (
  SELECT id FROM orders WHERE file_path IS NULL
);

-- Delete orders without file paths (old uploads before the fix)
DELETE FROM orders WHERE file_path IS NULL;

-- Reset the content_queue to ensure clean state
DELETE FROM content_queue WHERE order_id NOT IN (SELECT id FROM orders);

-- Clean up played content history for old items
DELETE FROM played_content_history WHERE file_path = '';

-- Reset display status for any stuck items
UPDATE orders 
SET display_status = 'queued', 
    display_started_at = NULL,
    display_completed_at = NULL
WHERE display_status IN ('active', 'playing', 'completed');

-- Reset content_queue active status
UPDATE content_queue SET is_active = false WHERE is_active = true;