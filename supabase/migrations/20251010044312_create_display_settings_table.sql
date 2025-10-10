/*
  # Create Display Settings Table

  1. New Tables
    - `display_settings`
      - `id` (uuid, primary key) - Settings ID
      - `user_id` (uuid, foreign key, unique) - Owner user ID
      - `border_theme` (text, default 'modern-gradient') - Border theme name
      - `transition_style` (text, default 'fade') - Transition style
      - `logo_enabled` (boolean, default false) - Whether logo is enabled
      - `logo_url` (text, nullable) - Logo URL
      - `background_color` (text, default '#000000') - Background color
      - `created_at` (timestamptz, default now()) - Creation timestamp
      - `updated_at` (timestamptz, default now()) - Last update timestamp
  
  2. Security
    - Enable RLS on `display_settings` table
    - Add policy for users to read their own settings
    - Add policy for users to insert their own settings
    - Add policy for users to update their own settings
*/

CREATE TABLE IF NOT EXISTS display_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  border_theme text DEFAULT 'modern-gradient',
  transition_style text DEFAULT 'fade',
  logo_enabled boolean DEFAULT false,
  logo_url text,
  background_color text DEFAULT '#000000',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS display_settings_user_id_idx ON display_settings(user_id);

ALTER TABLE display_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own display settings"
  ON display_settings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own display settings"
  ON display_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own display settings"
  ON display_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_display_settings_updated_at 
  BEFORE UPDATE ON display_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
