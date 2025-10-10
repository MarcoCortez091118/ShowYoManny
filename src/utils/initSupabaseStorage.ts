import { supabase } from '@/lib/supabase';

export async function initializeStorage() {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }

    const contentBucketExists = buckets?.some(bucket => bucket.name === 'content');

    if (!contentBucketExists) {
      const { error: createError } = await supabase.storage.createBucket('content', {
        public: true,
        fileSizeLimit: 104857600,
        allowedMimeTypes: ['image/*', 'video/*']
      });

      if (createError && !createError.message.includes('already exists')) {
        console.warn('Content bucket may already exist or creation not needed');
      }
    }

    const mediaBucketExists = buckets?.some(bucket => bucket.name === 'media');

    if (!mediaBucketExists) {
      const { error: createError } = await supabase.storage.createBucket('media', {
        public: true,
        fileSizeLimit: 104857600,
        allowedMimeTypes: ['image/*', 'video/*']
      });

      if (createError && !createError.message.includes('already exists')) {
        console.warn('Media bucket may already exist or creation not needed');
      }
    }

    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
}
