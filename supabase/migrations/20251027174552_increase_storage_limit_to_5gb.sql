/*
  # Increase Storage Bucket Size Limit to 5GB

  1. Changes
    - Increase file_size_limit in 'media' bucket from 500MB to 5GB
    - Allow administrator to upload very large high-quality videos
    
  2. Why
    - Admin needs to upload large 4K/8K videos
    - Professional content can be several GB in size
    - 5GB provides sufficient space for high-quality productions
    
  3. Notes
    - This is a significant increase for admin use cases
    - Frontend will still warn about large files
    - Compression tools available for optimization
    - Large uploads may take considerable time depending on connection
*/

-- Update the media bucket size limit to 5GB (5,368,709,120 bytes)
UPDATE storage.buckets 
SET file_size_limit = 5368709120
WHERE name = 'media';

-- Verify the update
DO $$
DECLARE
  current_limit BIGINT;
BEGIN
  SELECT file_size_limit INTO current_limit
  FROM storage.buckets
  WHERE name = 'media';
  
  IF current_limit = 5368709120 THEN
    RAISE NOTICE 'Successfully updated media bucket size limit to 5GB (5,368,709,120 bytes)';
  ELSE
    RAISE EXCEPTION 'Failed to update bucket size limit. Current limit: %', current_limit;
  END IF;
END $$;