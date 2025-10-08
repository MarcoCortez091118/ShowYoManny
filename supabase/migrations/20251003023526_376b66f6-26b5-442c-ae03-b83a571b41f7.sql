-- Ensure all approved admin items currently in the queue are active
UPDATE public.content_queue AS cq
SET is_active = true, updated_at = now()
FROM public.orders AS o
WHERE cq.order_id = o.id
  AND o.is_admin_content = true
  AND o.moderation_status = 'approved'
  AND cq.is_active = false;
