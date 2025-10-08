-- Clean all content and orders from the database (in correct order to respect foreign keys)
DELETE FROM public.content_queue;
DELETE FROM public.played_content_history;
DELETE FROM public.storage_cleanup_queue;
DELETE FROM public.kiosk_sync_state;
DELETE FROM public.orders;

-- Reset kiosk sync state to default
INSERT INTO public.kiosk_sync_state (current_index, current_content_id)
VALUES (0, NULL);