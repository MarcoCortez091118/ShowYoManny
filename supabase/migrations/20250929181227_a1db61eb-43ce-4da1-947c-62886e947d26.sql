-- Update the sync state to properly initialize with the first content item
UPDATE public.kiosk_sync_state 
SET current_content_id = (
    SELECT o.id 
    FROM public.content_queue cq 
    JOIN public.orders o ON cq.order_id = o.id 
    WHERE o.file_path IS NOT NULL 
    ORDER BY cq.queue_position ASC 
    LIMIT 1
),
current_index = 0,
last_advance_time = NOW(),
sync_timestamp = NOW()
WHERE id = (SELECT id FROM public.kiosk_sync_state LIMIT 1);