import { supabase } from '@/lib/supabase';

const STORAGE_BUCKET = 'media';
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const RECOMMENDED_MAX_SIZE = 100 * 1024 * 1024; // 100 MB (recommended for best performance)

class SupabaseStorageService {
  async uploadFile(
    file: File,
    path: string
  ): Promise<{ url: string | null; error: any }> {
    try {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const maxSizeMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
        return {
          url: null,
          error: {
            message: `File size (${sizeMB} MB) exceeds maximum allowed size (${maxSizeMB} MB). Please compress the file or use a smaller file.`
          }
        };
      }

      // Warn about large files
      if (file.size > RECOMMENDED_MAX_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        console.warn(`⚠️ Large file detected (${sizeMB} MB). Upload may be slow. Consider compressing.`);
      }
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

  getMaxFileSize(): number {
    return MAX_FILE_SIZE;
  }

  getRecommendedMaxSize(): number {
    return RECOMMENDED_MAX_SIZE;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  isFileTooLarge(file: File): boolean {
    return file.size > MAX_FILE_SIZE;
  }

  shouldWarnAboutSize(file: File): boolean {
    return file.size > RECOMMENDED_MAX_SIZE && file.size <= MAX_FILE_SIZE;
  }

  async createBucket(): Promise<void> {
    const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
    });

    if (error && !error.message.includes('already exists')) {
      console.error('Error creating bucket:', error);
    }
  }
}

export const supabaseStorageService = new SupabaseStorageService();
