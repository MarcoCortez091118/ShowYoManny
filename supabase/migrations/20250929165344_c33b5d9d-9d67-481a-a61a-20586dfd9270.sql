-- Fix security warnings by setting search_path for all functions

-- Fix cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_expired_content()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete expired content that should be auto-deleted
  DELETE FROM public.orders 
  WHERE scheduled_end IS NOT NULL 
    AND scheduled_end < NOW() 
    AND auto_delete_after_end = true;
    
  -- Remove expired items from content queue
  DELETE FROM public.content_queue 
  WHERE order_id NOT IN (SELECT id FROM public.orders);
  
  -- Log cleanup activity
  INSERT INTO public.played_content_history (
    order_id, 
    user_email, 
    pricing_option_id, 
    file_name, 
    revenue_cents, 
    completed_at
  ) 
  SELECT 
    gen_random_uuid(), 
    'system@cleanup.auto', 
    'cleanup-auto', 
    'Daily Cleanup', 
    0, 
    NOW()
  WHERE NOT EXISTS (
    SELECT 1 FROM public.played_content_history 
    WHERE DATE(completed_at) = CURRENT_DATE 
    AND user_email = 'system@cleanup.auto'
  );
END;
$$;

-- Fix video duration function
CREATE OR REPLACE FUNCTION public.extract_video_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- For video files, we'll set a default duration that can be updated later
  -- In a real implementation, you'd extract this from video metadata
  IF NEW.file_type LIKE 'video/%' AND NEW.video_duration_seconds IS NULL THEN
    NEW.video_duration_seconds := 30; -- Default 30 seconds, can be updated manually
  END IF;
  
  RETURN NEW;
END;
$$;