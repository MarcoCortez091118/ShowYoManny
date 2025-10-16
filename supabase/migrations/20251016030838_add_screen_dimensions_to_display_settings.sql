/*
  # Add Screen Dimensions to Display Settings

  1. Changes
    - Add `screen_width` column (integer, default 2048) - Width of the billboard screen in pixels
    - Add `screen_height` column (integer, default 2432) - Height of the billboard screen in pixels
    - Add `photo_display_duration_seconds` column (integer, default 10) - Default duration for photos
    - Add `min_video_duration_seconds` column (integer, default 5) - Minimum video duration
    - Add `max_video_duration_seconds` column (integer, default 60) - Maximum video duration
    - Add `max_image_file_size_mb` column (integer, default 25) - Maximum image file size in MB
    - Add `max_video_file_size_mb` column (integer, default 600) - Maximum video file size in MB
    - Add `recommended_image_format` column (text, default 'PNG or high-quality JPEG') - Recommended image format
    - Add `recommended_video_format` column (text, default 'MP4 (H.264) or MOV') - Recommended video format

  2. Notes
    - These settings will control the actual display dimensions for the Media Player (KioskDisplay)
    - The Kiosk Simulator will use these same dimensions to match exactly
    - All preview components will use these dimensions for accurate representation
    - Changes to these settings will immediately affect all new content uploads and displays
*/

DO $$
BEGIN
  -- Add screen_width column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'display_settings' AND column_name = 'screen_width'
  ) THEN
    ALTER TABLE display_settings ADD COLUMN screen_width integer DEFAULT 2048 NOT NULL;
  END IF;

  -- Add screen_height column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'display_settings' AND column_name = 'screen_height'
  ) THEN
    ALTER TABLE display_settings ADD COLUMN screen_height integer DEFAULT 2432 NOT NULL;
  END IF;

  -- Add photo_display_duration_seconds column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'display_settings' AND column_name = 'photo_display_duration_seconds'
  ) THEN
    ALTER TABLE display_settings ADD COLUMN photo_display_duration_seconds integer DEFAULT 10 NOT NULL;
  END IF;

  -- Add min_video_duration_seconds column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'display_settings' AND column_name = 'min_video_duration_seconds'
  ) THEN
    ALTER TABLE display_settings ADD COLUMN min_video_duration_seconds integer DEFAULT 5 NOT NULL;
  END IF;

  -- Add max_video_duration_seconds column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'display_settings' AND column_name = 'max_video_duration_seconds'
  ) THEN
    ALTER TABLE display_settings ADD COLUMN max_video_duration_seconds integer DEFAULT 60 NOT NULL;
  END IF;

  -- Add max_image_file_size_mb column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'display_settings' AND column_name = 'max_image_file_size_mb'
  ) THEN
    ALTER TABLE display_settings ADD COLUMN max_image_file_size_mb integer DEFAULT 25 NOT NULL;
  END IF;

  -- Add max_video_file_size_mb column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'display_settings' AND column_name = 'max_video_file_size_mb'
  ) THEN
    ALTER TABLE display_settings ADD COLUMN max_video_file_size_mb integer DEFAULT 600 NOT NULL;
  END IF;

  -- Add recommended_image_format column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'display_settings' AND column_name = 'recommended_image_format'
  ) THEN
    ALTER TABLE display_settings ADD COLUMN recommended_image_format text DEFAULT 'PNG or high-quality JPEG' NOT NULL;
  END IF;

  -- Add recommended_video_format column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'display_settings' AND column_name = 'recommended_video_format'
  ) THEN
    ALTER TABLE display_settings ADD COLUMN recommended_video_format text DEFAULT 'MP4 (H.264) or MOV' NOT NULL;
  END IF;
END $$;

-- Add check constraints for valid dimensions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'display_settings_screen_width_positive'
  ) THEN
    ALTER TABLE display_settings ADD CONSTRAINT display_settings_screen_width_positive CHECK (screen_width > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'display_settings_screen_height_positive'
  ) THEN
    ALTER TABLE display_settings ADD CONSTRAINT display_settings_screen_height_positive CHECK (screen_height > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'display_settings_durations_positive'
  ) THEN
    ALTER TABLE display_settings ADD CONSTRAINT display_settings_durations_positive CHECK (
      photo_display_duration_seconds > 0 AND
      min_video_duration_seconds > 0 AND
      max_video_duration_seconds > 0 AND
      min_video_duration_seconds < max_video_duration_seconds
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'display_settings_file_sizes_positive'
  ) THEN
    ALTER TABLE display_settings ADD CONSTRAINT display_settings_file_sizes_positive CHECK (
      max_image_file_size_mb > 0 AND
      max_video_file_size_mb > 0
    );
  END IF;
END $$;
