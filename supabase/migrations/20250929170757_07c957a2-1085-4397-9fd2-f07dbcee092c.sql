-- Approve previously rejected content so it appears in the kiosk
UPDATE public.orders 
SET moderation_status = 'approved', display_status = 'queued' 
WHERE moderation_status = 'rejected';