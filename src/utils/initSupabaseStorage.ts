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
      console.log('Creating content bucket...');
      const { error: createError } = await supabase.storage.createBucket('content', {
        public: true,
        fileSizeLimit: 104857600,
        allowedMimeTypes: ['image/*', 'video/*']
      });

      if (createError && !createError.message.includes('already exists')) {
        console.error('Error creating content bucket:', createError);
        return false;
      }

      console.log('Content bucket created successfully');
    } else {
      console.log('Content bucket already exists');
    }

    const mediaBucketExists = buckets?.some(bucket => bucket.name === 'media');

    if (!mediaBucketExists) {
      console.log('Creating media bucket...');
      const { error: createError } = await supabase.storage.createBucket('media', {
        public: true,
        fileSizeLimit: 104857600,
        allowedMimeTypes: ['image/*', 'video/*']
      });

      if (createError && !createError.message.includes('already exists')) {
        console.error('Error creating media bucket:', createError);
        return false;
      }

      console.log('Media bucket created successfully');
    } else {
      console.log('Media bucket already exists');
    }

    return true;
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
}
