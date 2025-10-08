-- Activate the first item in the queue if nothing is active
UPDATE content_queue 
SET is_active = true 
WHERE queue_position = 1 
AND NOT EXISTS (SELECT 1 FROM content_queue WHERE is_active = true);