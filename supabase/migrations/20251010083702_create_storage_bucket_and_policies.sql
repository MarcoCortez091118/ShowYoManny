/*
  # Create Storage Bucket and Policies
  
  1. Storage Bucket
    - Creates 'media' bucket for storing images and videos
    - Public access enabled for media URLs
    - File size limit: 100MB
  
  2. Security Policies
    - Authenticated users can upload files
    - Public read access for all files
    - Users can delete their own files
  
  Notes:
    - Bucket creation is idempotent (won't fail if exists)
    - Policies ensure users can only manage their own content
*/

-- Create the media bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  104857600, -- 100MB
  ARRAY['image/*', 'video/*']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to recreate them
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Policy: Allow public read access to all files
CREATE POLICY "Public read access for media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');

-- Policy: Allow users to update their own files
CREATE POLICY "Users can update own media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = owner::text)
WITH CHECK (bucket_id = 'media');

-- Policy: Allow users to delete their own files
CREATE POLICY "Users can delete own media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = owner::text);