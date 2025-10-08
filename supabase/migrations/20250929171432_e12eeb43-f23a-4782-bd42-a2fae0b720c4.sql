-- Clear and rebuild content queue properly
DELETE FROM public.content_queue;

-- Insert all approved content into queue with proper positions
INSERT INTO public.content_queue (order_id, queue_position, is_active)
SELECT 
  o.id,
  ROW_NUMBER() OVER (ORDER BY o.created_at ASC) as position,
  CASE WHEN ROW_NUMBER() OVER (ORDER BY o.created_at ASC) = 1 THEN true ELSE false END
FROM public.orders o
WHERE o.moderation_status = 'approved' 
  AND o.display_status IN ('queued', 'active', 'playing');

-- Update the first item to be active
UPDATE public.orders 
SET display_status = 'active' 
WHERE id = (
  SELECT order_id 
  FROM public.content_queue 
  WHERE is_active = true 
  LIMIT 1
);