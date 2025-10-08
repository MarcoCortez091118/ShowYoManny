-- Add scheduling and repeat fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS scheduled_start TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scheduled_end TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS auto_delete_after_end BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS repeat_frequency_per_day INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_admin_content BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS video_duration_seconds INTEGER;

-- Create cleanup function for expired content
CREATE OR REPLACE FUNCTION public.cleanup_expired_content()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup at 11:59 PM
SELECT cron.schedule(
  'daily-content-cleanup',
  '59 23 * * *', -- Every day at 11:59 PM
  'SELECT public.cleanup_expired_content();'
);

-- Add trigger to automatically set video duration when file is uploaded
CREATE OR REPLACE FUNCTION public.extract_video_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
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

CREATE OR REPLACE TRIGGER set_video_duration_trigger
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.extract_video_duration();