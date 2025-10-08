-- Enable real-time for content_queue table
ALTER TABLE public.content_queue REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_queue;

-- Create a global sync state table for kiosk synchronization
CREATE TABLE public.kiosk_sync_state (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  current_content_id uuid REFERENCES public.orders(id),
  current_index integer NOT NULL DEFAULT 0,
  last_advance_time timestamp with time zone NOT NULL DEFAULT now(),
  sync_timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on kiosk_sync_state
ALTER TABLE public.kiosk_sync_state ENABLE ROW LEVEL SECURITY;

-- Create policies for kiosk_sync_state
CREATE POLICY "Anyone can view sync state" 
ON public.kiosk_sync_state 
FOR SELECT 
USING (true);

CREATE POLICY "System can update sync state" 
ON public.kiosk_sync_state 
FOR ALL 
USING (true);

-- Enable real-time for kiosk_sync_state
ALTER TABLE public.kiosk_sync_state REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kiosk_sync_state;

-- Insert initial sync state record
INSERT INTO public.kiosk_sync_state (current_index) VALUES (0);

-- Create trigger to update sync state timestamp
CREATE TRIGGER update_kiosk_sync_updated_at
BEFORE UPDATE ON public.kiosk_sync_state
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();