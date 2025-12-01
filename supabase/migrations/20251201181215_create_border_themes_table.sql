/*
  # Create Border Themes Table for Custom PNG Borders

  ## Summary
  This migration creates a new `border_themes` table to store custom PNG border overlays that can be uploaded by admins and applied to content displayed on kiosks.

  ## 1. New Tables
    - `border_themes`
      - `id` (uuid, primary key) - Unique identifier for each border theme
      - `name` (text, required) - Display name of the border theme
      - `category` (text, required) - Category for organizing borders (Holiday, Special Occasions, etc.)
      - `description` (text, optional) - Description of the border theme
      - `image_url` (text, required) - URL to the PNG file in Supabase storage
      - `thumbnail_url` (text, optional) - Smaller preview image URL
      - `is_active` (boolean, default true) - Whether the border is available for use
      - `sort_order` (integer, default 0) - For custom ordering in admin UI
      - `created_by` (uuid, optional) - Reference to admin user who created it
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
    - Enable RLS on `border_themes` table
    - Add policy for authenticated users to READ all active border themes
    - Add policy for admin users to CREATE, UPDATE, DELETE border themes
    - Border themes are public-readable but only admin-writable

  ## 3. Storage
    - Uses existing `content-uploads` bucket for PNG files
    - Border PNGs will be stored in `borders/` prefix
    - Storage policies already allow authenticated uploads

  ## 4. Migration Safety
    - Uses IF NOT EXISTS to prevent errors on re-run
    - Includes check constraints for valid categories
    - Non-destructive migration - only creates new table
*/

-- Create border_themes table
CREATE TABLE IF NOT EXISTS border_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (
    category IN (
      'Holiday',
      'Special Occasions',
      'Futuristic',
      'Seasonal',
      'Custom'
    )
  ),
  description text,
  image_url text NOT NULL,
  thumbnail_url text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE border_themes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active border themes (for content upload page)
CREATE POLICY "Anyone can view active border themes"
  ON border_themes
  FOR SELECT
  USING (is_active = true);

-- Policy: Admins can view all border themes (including inactive)
CREATE POLICY "Admins can view all border themes"
  ON border_themes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND 'admin' = ANY(users.roles)
    )
  );

-- Policy: Admins can insert border themes
CREATE POLICY "Admins can create border themes"
  ON border_themes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND 'admin' = ANY(users.roles)
    )
  );

-- Policy: Admins can update border themes
CREATE POLICY "Admins can update border themes"
  ON border_themes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND 'admin' = ANY(users.roles)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND 'admin' = ANY(users.roles)
    )
  );

-- Policy: Admins can delete border themes
CREATE POLICY "Admins can delete border themes"
  ON border_themes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND 'admin' = ANY(users.roles)
    )
  );

-- Create index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_border_themes_category ON border_themes(category);

-- Create index for faster active border lookups
CREATE INDEX IF NOT EXISTS idx_border_themes_active ON border_themes(is_active) WHERE is_active = true;

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_border_themes_sort_order ON border_themes(sort_order, created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_border_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_border_themes_updated_at
  BEFORE UPDATE ON border_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_border_themes_updated_at();
