/*
  # Setup automatic cleanup scheduler using pg_cron
  
  1. Purpose
    - Automatically run cleanup_unpaid_content() every 5 minutes
    - Ensures unpaid content is deleted automatically without manual intervention
  
  2. Changes
    - Enable pg_cron extension if not already enabled
    - Create a cron job that runs every 5 minutes
    - The job calls cleanup_unpaid_content() function
  
  3. Notes
    - pg_cron runs server-side and does not require external scheduling
    - Runs every 5 minutes using standard cron syntax
    - Job name: cleanup-unpaid-content-job
*/

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if it exists (ignore errors if job doesn't exist)
DO $$
BEGIN
  PERFORM cron.unschedule('cleanup-unpaid-content-job');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Schedule the cleanup job to run every 5 minutes
SELECT cron.schedule(
  'cleanup-unpaid-content-job',
  '*/5 * * * *',
  $$SELECT cleanup_unpaid_content();$$
);