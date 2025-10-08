-- Add all approved admin orders that are not in the queue yet
INSERT INTO public.content_queue (order_id, queue_position, is_active)
SELECT 
  o.id,
  (SELECT COALESCE(MAX(queue_position), 0) FROM public.content_queue) + ROW_NUMBER() OVER (ORDER BY o.created_at ASC),
  false
FROM public.orders o
LEFT JOIN public.content_queue cq ON cq.order_id = o.id
WHERE o.is_admin_content = true 
  AND o.moderation_status = 'approved'
  AND cq.id IS NULL;