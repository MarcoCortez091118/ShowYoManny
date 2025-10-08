-- Update schedule for Tacos La Broadway Vertical Individual.mp4
-- Set to play from 2:15 AM to 2:20 AM (EDT = 6:15 AM to 6:20 AM UTC)
-- Remove daily play limit so it can repeat during the window

UPDATE orders 
SET 
  scheduled_start = '2025-10-01 06:15:00+00',
  scheduled_end = '2025-10-01 06:20:00+00',
  repeat_frequency_per_day = NULL,
  max_plays = 999999,
  play_count = 0
WHERE file_name = 'Tacos La Broadway Vertical Individual.mp4';