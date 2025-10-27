import { supabase } from '@/lib/supabase';

const STORAGE_BUCKET = 'media';
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB
const WARNING_SIZE_1 = 100 * 1024 * 1024; // 100 MB
const WARNING_SIZE_2 = 500 * 1024 * 1024; // 500 MB
const WARNING_SIZE_3 = 1024 * 1024 * 1024; // 1 GB

class SupabaseStorageService {
  async uploadFile(
    file: File,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string | null; error: any }> {
    try {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const sizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
        return {
          url: null,
          error: {
            message: `File size (${sizeGB} GB) exceeds maximum allowed size (5 GB). Please use a smaller file.`
          }
        };
      }

      // Warn about large files with different severity levels
      if (file.size > WARNING_SIZE_3) {
        const sizeGB = (file.size / (1024 * 1024 * 1024)).toFixed(2);
        console.warn(`⚠️ Very large file detected (${sizeGB} GB). Upload will take significant time.`);
      } else if (file.size > WARNING_SIZE_2) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        console.warn(`⚠️ Large file detected (${sizeMB} MB). Upload may take several minutes.`);
      } else if (file.size > WARNING_SIZE_1) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        console.warn(`ℹ️ File size: ${sizeMB} MB. Upload may take some time.`);
      }

      console.log('🚀 Starting upload to Supabase Storage...');
      onProgress?.(10); // Initial progress

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('❌ Upload error:', error);
        return { url: null, error };
      }

      console.log('✅ Upload successful, generating public URL...');
      onProgress?.(95); // Almost done

      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(data.path);

      console.log('✅ Public URL generated:', urlData.publicUrl);
      onProgress?.(100); // Complete

      return { url: urlData.publicUrl, error: null };
    } catch (error) {
      console.error('❌ Upload exception:', error);
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

  getWarningSize1(): number {
    return WARNING_SIZE_1;
  }

  getWarningSize2(): number {
    return WARNING_SIZE_2;
  }

  getWarningSize3(): number {
    return WARNING_SIZE_3;
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

  getFileSizeWarningLevel(file: File): 'none' | 'info' | 'warning' | 'danger' {
    if (file.size > WARNING_SIZE_3) return 'danger';
    if (file.size > WARNING_SIZE_2) return 'warning';
    if (file.size > WARNING_SIZE_1) return 'info';
    return 'none';
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
