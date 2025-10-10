import { supabase } from '@/lib/supabase';

const STORAGE_BUCKET = 'media';

class SupabaseStorageService {
  async uploadFile(
    file: File,
    path: string
  ): Promise<{ url: string | null; error: any }> {
    try {
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        return { url: null, error };
      }

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);

      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      return { url: null, error };
    }
  }

  async deleteFile(path: string): Promise<{ error: any }> {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    return { error };
  }

  async listFiles(folder: string): Promise<{ files: any[]; error: any }> {
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(folder);

    return { files: data || [], error };
  }

  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  async createBucket(): Promise<void> {
    const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: 52428800,
    });

    if (error && !error.message.includes('already exists')) {
      console.error('Error creating bucket:', error);
    }
  }
}

export const supabaseStorageService = new SupabaseStorageService();
