-- Now update the status values without constraint interference
UPDATE public.orders 
SET status = CASE 
  WHEN status = 'paid' THEN 'completed'
  ELSE status
END;

-- Add back the constraints with the correct allowed values
ALTER TABLE public.orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));

ALTER TABLE public.orders 
ADD CONSTRAINT orders_display_status_check 
CHECK (display_status IN ('queued', 'active', 'playing', 'completed', 'paused', 'rejected'));

ALTER TABLE public.orders 
ADD CONSTRAINT orders_moderation_status_check 
CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'flagged'));