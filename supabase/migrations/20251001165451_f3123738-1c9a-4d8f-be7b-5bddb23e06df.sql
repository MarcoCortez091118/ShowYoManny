-- Add timer loop fields to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS timer_loop_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS timer_loop_minutes integer;

-- Helpful index for playlist generation queries
CREATE INDEX IF NOT EXISTS idx_played_content_history_file_time
  ON public.played_content_history (file_path, completed_at DESC);
