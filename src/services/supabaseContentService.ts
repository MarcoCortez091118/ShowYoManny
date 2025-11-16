import { supabase } from '@/lib/supabase';
import { supabaseStorageService } from './supabaseStorageService';

export interface QueueItemInput {
  file: File;
  borderStyle: string;
  duration: number;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  timerLoopEnabled?: boolean;
  timerLoopMinutes?: number | null;
  timerLoopAutomatic?: boolean;
  metadata?: {
    fitMode?: string;
    zoom?: number;
    rotation?: number;
    positionX?: number;
    positionY?: number;
  };
  onProgress?: (progress: number) => void;
}

export interface QueueItem {
  id: string;
  user_id: string;
  kiosk_id: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url: string | null;
  title: string | null;
  file_name: string;
  duration: number;
  order_index: number;
  status: 'pending' | 'active' | 'completed';
  border_id: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  timer_loop_enabled: boolean;
  timer_loop_minutes: number | null;
  timer_loop_automatic: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

class SupabaseContentService {
  async createQueueItem(input: QueueItemInput): Promise<QueueItem> {
    const { file, borderStyle, duration, scheduledStart, scheduledEnd, timerLoopEnabled, timerLoopMinutes, timerLoopAutomatic, metadata, onProgress } = input;

    console.log('✅ Using Supabase Content Service - NOT Firebase');
    console.log('📁 File to upload:', file.name, file.type, file.size);

    onProgress?.(5); // Starting

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    console.log('👤 User authenticated:', user.id);
    onProgress?.(10); // Authenticated

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `content/${fileName}`;

    console.log('📤 Uploading to Supabase Storage bucket "media" at path:', filePath);

    // Pass progress callback to storage service
    const { url, error: uploadError } = await supabaseStorageService.uploadFile(file, filePath, (storageProgress) => {
      // Map storage progress (10-95) to overall progress (15-85)
      const mappedProgress = 15 + (storageProgress - 10) * 0.7;
      onProgress?.(Math.round(mappedProgress));
    });

    if (uploadError || !url) {
      console.error('❌ Supabase upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError?.message || 'Unknown error'}`);
    }

    console.log('✅ File uploaded successfully. URL:', url);
    onProgress?.(90); // Upload complete, now creating DB record

    const mediaType = file.type.startsWith('image/') ? 'image' : 'video';

    const maxOrderResult = await supabase
      .from('queue_items')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrderIndex = (maxOrderResult.data?.order_index ?? -1) + 1;

    onProgress?.(95); // Creating database record

    const { data, error } = await supabase
      .from('queue_items')
      .insert({
        user_id: user.id,
        media_url: url,
        media_type: mediaType,
        file_name: file.name,
        title: file.name,
        duration: duration,
        order_index: nextOrderIndex,
        status: 'pending',
        border_id: borderStyle === 'none' ? null : borderStyle,
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        timer_loop_enabled: timerLoopEnabled || false,
        timer_loop_minutes: timerLoopMinutes,
        timer_loop_automatic: timerLoopAutomatic || false,
        metadata: {
          ...metadata,
          is_admin_content: true,
        },
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating queue item:', error);
      throw new Error(`Failed to create queue item: ${error.message}`);
    }

    console.log('✅ Queue item created successfully');
    onProgress?.(100); // Complete!

    return data as QueueItem;
  }

  async fetchQueue(): Promise<QueueItem[]> {
    const { data, error } = await supabase
      .from('queue_items')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching queue:', error);
      throw new Error(`Failed to fetch queue: ${error.message}`);
    }

    return data as QueueItem[];
  }

  async updateQueueItem(id: string, updates: Partial<QueueItem>): Promise<void> {
    const { error } = await supabase
      .from('queue_items')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Error updating queue item:', error);
      throw new Error(`Failed to update queue item: ${error.message}`);
    }
  }

  async deleteQueueItem(id: string): Promise<void> {
    const { data: item } = await supabase
      .from('queue_items')
      .select('media_url')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase
      .from('queue_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting queue item:', error);
      throw new Error(`Failed to delete queue item: ${error.message}`);
    }

    if (item?.media_url) {
      const path = item.media_url.split('/').pop();
      if (path) {
        await supabaseStorageService.deleteFile(`content/${path}`).catch(console.error);
      }
    }
  }

  async reorderQueue(items: { id: string; order_index: number }[]): Promise<void> {
    for (const item of items) {
      await supabase
        .from('queue_items')
        .update({ order_index: item.order_index })
        .eq('id', item.id);
    }
  }
}

export const supabaseContentService = new SupabaseContentService();
