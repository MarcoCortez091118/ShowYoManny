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
  metadata?: {
    fitMode?: string;
    zoom?: number;
    rotation?: number;
    positionX?: number;
    positionY?: number;
  };
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
  metadata: any;
  created_at: string;
  updated_at: string;
}

class SupabaseContentService {
  async createQueueItem(input: QueueItemInput): Promise<QueueItem> {
    const { file, borderStyle, duration, scheduledStart, scheduledEnd, timerLoopEnabled, timerLoopMinutes, metadata } = input;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `content/${fileName}`;

    const { url, error: uploadError } = await supabaseStorageService.uploadFile(file, filePath);

    if (uploadError || !url) {
      throw new Error(`Failed to upload file: ${uploadError?.message || 'Unknown error'}`);
    }

    const mediaType = file.type.startsWith('image/') ? 'image' : 'video';

    const maxOrderResult = await supabase
      .from('queue_items')
      .select('order_index')
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrderIndex = (maxOrderResult.data?.order_index ?? -1) + 1;

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
        metadata: metadata || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating queue item:', error);
      throw new Error(`Failed to create queue item: ${error.message}`);
    }

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
