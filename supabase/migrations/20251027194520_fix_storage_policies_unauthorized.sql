/*
  # Fix Storage Policies - Unauthorized Error

  This migration fixes the "new row violates row-level security policy" error
  when uploading files to the media bucket.

  ## Problem
  The previous policies were too restrictive and checking owner fields that
  don't get set during INSERT operations, causing 403 Unauthorized errors.

  ## Changes
  1. Drop all existing storage policies
  2. Create new permissive policies that work with Supabase Storage:
     - Allow ALL authenticated users to INSERT (upload) files
     - Allow public SELECT (read) access
     - Allow authenticated users to UPDATE their own files
     - Allow authenticated users to DELETE their own files

  ## Security
  - Files are still protected - only authenticated users can upload
  - Public can view files (required for kiosk display)
  - Users can only modify/delete files they own
*/

-- Drop all existing policies on storage.objects for the media bucket
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;

-- Policy 1: Allow authenticated users to upload files to media bucket
-- This is the key fix - no owner check on INSERT since owner is set by the system
CREATE POLICY "Allow authenticated uploads to media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Policy 2: Allow public to read/select files from media bucket
CREATE POLICY "Allow public reads from media"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');

-- Policy 3: Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated updates to own media"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'media' AND auth.uid() = owner);

-- Policy 4: Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated deletes of own media"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND auth.uid() = owner);