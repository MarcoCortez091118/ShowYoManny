/*
  # Make user_id nullable for public users

  1. Changes
    - Make `user_id` column nullable in `queue_items` table
    - Drop and recreate foreign key constraint to allow NULL values
    - This allows public/guest users to create orders without authentication
  
  2. Security
    - RLS policies remain unchanged
    - NULL user_id indicates a public/guest order
    - Email is stored in metadata for customer communication

  3. Notes
    - Public orders will have user_id = NULL instead of dummy UUID
    - Maintains referential integrity for authenticated users
    - Backwards compatible with existing data
*/

-- Drop the existing foreign key constraint
ALTER TABLE queue_items 
DROP CONSTRAINT IF EXISTS queue_items_user_id_fkey;

-- Make user_id nullable
ALTER TABLE queue_items 
ALTER COLUMN user_id DROP NOT NULL;

-- Recreate foreign key constraint (allows NULL)
ALTER TABLE queue_items 
ADD CONSTRAINT queue_items_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Update any existing dummy UUID entries to NULL
UPDATE queue_items 
SET user_id = NULL 
WHERE user_id = '00000000-0000-0000-0000-000000000000';
