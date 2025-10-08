-- Remove all status-related constraints first
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check CASCADE;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_display_status_check CASCADE;  
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_moderation_status_check CASCADE;