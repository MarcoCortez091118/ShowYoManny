/*
  # Add timer_loop_automatic field to queue_items

  1. Changes to queue_items table
    - Add `timer_loop_automatic` (boolean, default false) - Flag for automatic timer calculation
    
  2. Notes
    - When true, the system calculates the loop interval automatically based on:
      - Total duration of all items in the queue
      - Position of the item in the queue
      - Ensures optimal distribution of content playback
*/

-- Add timer_loop_automatic column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_items' AND column_name = 'timer_loop_automatic'
  ) THEN
    ALTER TABLE queue_items ADD COLUMN timer_loop_automatic boolean DEFAULT false;
  END IF;
END $$;

-- Create index for automatic timer queries
CREATE INDEX IF NOT EXISTS queue_items_timer_automatic_idx 
ON queue_items(timer_loop_automatic) 
WHERE timer_loop_automatic = true;