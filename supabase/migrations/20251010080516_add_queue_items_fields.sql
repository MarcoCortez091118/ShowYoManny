/*
  # Add missing fields to queue_items table

  1. Changes to queue_items table
    - Add `border_id` (text, nullable) - Border style ID
    - Add `scheduled_end` (timestamptz, nullable) - Scheduled end time
    - Add `timer_loop_enabled` (boolean, default false) - Timer loop flag
    - Add `timer_loop_minutes` (integer, nullable) - Loop interval in minutes
    - Add `file_name` (text, nullable) - Original file name
    - Add `metadata` (jsonb, nullable) - Additional metadata (fit mode, zoom, rotation, etc.)
    
  2. Notes
    - All fields are nullable or have defaults for backward compatibility
    - metadata field stores editor adjustments (fitMode, zoom, rotation, positionX, positionY)
*/

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_items' AND column_name = 'border_id'
  ) THEN
    ALTER TABLE queue_items ADD COLUMN border_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_items' AND column_name = 'scheduled_end'
  ) THEN
    ALTER TABLE queue_items ADD COLUMN scheduled_end timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_items' AND column_name = 'timer_loop_enabled'
  ) THEN
    ALTER TABLE queue_items ADD COLUMN timer_loop_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_items' AND column_name = 'timer_loop_minutes'
  ) THEN
    ALTER TABLE queue_items ADD COLUMN timer_loop_minutes integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_items' AND column_name = 'file_name'
  ) THEN
    ALTER TABLE queue_items ADD COLUMN file_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'queue_items' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE queue_items ADD COLUMN metadata jsonb;
  END IF;
END $$;

-- Create index for border_id for faster queries
CREATE INDEX IF NOT EXISTS queue_items_border_id_idx ON queue_items(border_id);

-- Create index for timer_loop_enabled
CREATE INDEX IF NOT EXISTS queue_items_timer_loop_idx ON queue_items(timer_loop_enabled) WHERE timer_loop_enabled = true;