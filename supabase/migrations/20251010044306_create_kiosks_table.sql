/*
  # Create Kiosks Table

  1. New Tables
    - `kiosks`
      - `id` (uuid, primary key) - Kiosk ID
      - `user_id` (uuid, foreign key) - Owner user ID
      - `name` (text, not null) - Kiosk name
      - `location` (text, nullable) - Physical location
      - `status` (text, default 'active') - active or inactive
      - `created_at` (timestamptz, default now()) - Creation timestamp
      - `updated_at` (timestamptz, default now()) - Last update timestamp
  
  2. Security
    - Enable RLS on `kiosks` table
    - Add policy for users to read their own kiosks
    - Add policy for users to insert their own kiosks
    - Add policy for users to update their own kiosks
    - Add policy for users to delete their own kiosks
*/

CREATE TABLE IF NOT EXISTS kiosks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kiosks_user_id_idx ON kiosks(user_id);

ALTER TABLE kiosks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own kiosks"
  ON kiosks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own kiosks"
  ON kiosks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own kiosks"
  ON kiosks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own kiosks"
  ON kiosks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_kiosks_updated_at 
  BEFORE UPDATE ON kiosks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
