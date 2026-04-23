/*
  # Increase Storage Bucket Limit to 500MB for Large Video Uploads
  
  1. Problem
    - Current limit: 100MB
    - Users need to upload videos up to 60MB (and larger)
    - Uploads fail with "object exceeded the maximum allowed size"
  
  2. Solution
    - Increase 'media' bucket limit from 100MB to 500MB
    - Allows for large video uploads and high-quality media
  
  3. Changes
    - Update storage.buckets file_size_limit for 'media' bucket
    - New limit: 500MB (524,288,000 bytes)
  
  4. Notes
    - Frontend validation already supports up to 500MB for videos
    - Display settings configured for 500MB max video size
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
    RAISE NOTICE 'Successfully updated media bucket size limit to 500MB (524,288,000 bytes)';
  ELSE
    RAISE EXCEPTION 'Failed to update bucket size limit. Current limit: %', current_limit;
  END IF;
END $$;
