/*
  # Increase Storage Bucket Size Limit

  1. Changes
    - Increase file_size_limit in 'media' bucket from 100MB to 500MB
    - Allow larger video and image uploads
    
  2. Why
    - Users encountering "object exceeded maximum allowed size" errors
    - Need to support larger high-quality videos
    - 500MB provides comfortable headroom for 4K content
    
  3. Notes
    - Frontend compression still active (reduces files before upload)
    - Larger files will be compressed client-side when possible
    - Recommended to use video compression for files >100MB
*/

-- Update the media bucket size limit to 500MB (524,288,000 bytes)
UPDATE storage.buckets 
SET file_size_limit = 524288000
WHERE name = 'media';

-- Verify the update
DO $$
DECLARE
  current_limit BIGINT;
BEGIN
  SELECT file_size_limit INTO current_limit
  FROM storage.buckets
  WHERE name = 'media';
  
  IF current_limit = 524288000 THEN
    RAISE NOTICE 'Successfully updated media bucket size limit to 500MB';
  ELSE
    RAISE EXCEPTION 'Failed to update bucket size limit. Current limit: %', current_limit;
  END IF;
END $$;