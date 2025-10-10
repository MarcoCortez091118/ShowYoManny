/*
  # Create Queue Items Table

  1. New Tables
    - `queue_items`
      - `id` (uuid, primary key) - Queue item ID
      - `user_id` (uuid, foreign key) - Owner user ID
      - `kiosk_id` (uuid, foreign key, nullable) - Associated kiosk
      - `media_url` (text, not null) - URL to media file
      - `media_type` (text, not null) - image or video
      - `thumbnail_url` (text, nullable) - Thumbnail URL
      - `title` (text, nullable) - Item title
      - `duration` (integer, default 5) - Display duration in seconds
      - `order_index` (integer, default 0) - Display order
      - `status` (text, default 'pending') - pending, active, or completed
      - `scheduled_start` (timestamptz, nullable) - Scheduled start time
      - `created_at` (timestamptz, default now()) - Creation timestamp
      - `updated_at` (timestamptz, default now()) - Last update timestamp
  
  2. Security
    - Enable RLS on `queue_items` table
    - Add policy for users to read their own queue items
    - Add policy for users to insert their own queue items
    - Add policy for users to update their own queue items
    - Add policy for users to delete their own queue items
*/

CREATE TABLE IF NOT EXISTS queue_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kiosk_id uuid REFERENCES kiosks(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  thumbnail_url text,
  title text,
  duration integer DEFAULT 5,
  order_index integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  scheduled_start timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS queue_items_user_id_idx ON queue_items(user_id);
CREATE INDEX IF NOT EXISTS queue_items_kiosk_id_idx ON queue_items(kiosk_id);
CREATE INDEX IF NOT EXISTS queue_items_status_idx ON queue_items(status);
CREATE INDEX IF NOT EXISTS queue_items_order_idx ON queue_items(order_index);

ALTER TABLE queue_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own queue items"
  ON queue_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queue items"
  ON queue_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own queue items"
  ON queue_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own queue items"
  ON queue_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER update_queue_items_updated_at 
  BEFORE UPDATE ON queue_items 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
