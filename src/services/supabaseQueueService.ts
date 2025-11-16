import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type QueueItem = Database['public']['Tables']['queue_items']['Row'];
type QueueItemInsert = Database['public']['Tables']['queue_items']['Insert'];
type QueueItemUpdate = Database['public']['Tables']['queue_items']['Update'];

export type ContentStatus = 'scheduled' | 'published' | 'expired' | 'active' | 'pending' | 'completed';

export interface EnrichedQueueItem extends QueueItem {
  computed_status: ContentStatus;
  is_visible: boolean;
  expires_in_minutes?: number;
}

class SupabaseQueueService {
  private computeItemStatus(item: QueueItem): { status: ContentStatus; isVisible: boolean; expiresIn?: number } {
    const now = new Date();
    const scheduledStart = item.scheduled_start ? new Date(item.scheduled_start) : null;
    const scheduledEnd = item.scheduled_end ? new Date(item.scheduled_end) : null;

    if (item.status === 'pending') {
      return { status: 'pending', isVisible: false };
    }

    if (scheduledEnd && now > scheduledEnd) {
      return { status: 'expired', isVisible: false };
    }

    if (scheduledStart && now < scheduledStart) {
      return { status: 'scheduled', isVisible: false };
    }

    if (scheduledStart && now >= scheduledStart) {
      const expiresIn = scheduledEnd ? Math.floor((scheduledEnd.getTime() - now.getTime()) / (1000 * 60)) : undefined;
      return { status: 'published', isVisible: true, expiresIn };
    }

    if (item.status === 'active') {
      const expiresIn = scheduledEnd ? Math.floor((scheduledEnd.getTime() - now.getTime()) / (1000 * 60)) : undefined;
      return { status: 'active', isVisible: true, expiresIn };
    }

    return { status: item.status as ContentStatus, isVisible: false };
  }

  async getQueueItems(userId: string): Promise<EnrichedQueueItem[]> {
    const { data, error } = await supabase
      .from('queue_items')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching queue items:', error);
      return [];
    }

    return (data || []).map(item => {
      const { status, isVisible, expiresIn } = this.computeItemStatus(item);
      return {
        ...item,
        computed_status: status,
        is_visible: isVisible,
        expires_in_minutes: expiresIn,
      };
    });
  }

  async getPublishedQueueItems(kioskId: string): Promise<EnrichedQueueItem[]> {
    const { data, error } = await supabase
      .from('queue_items')
      .select('*')
      .eq('kiosk_id', kioskId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching queue items:', error);
      return [];
    }

    const enrichedItems = (data || []).map(item => {
      const { status, isVisible, expiresIn } = this.computeItemStatus(item);
      return {
        ...item,
        computed_status: status,
        is_visible: isVisible,
        expires_in_minutes: expiresIn,
      };
    });

    return enrichedItems.filter(item => item.is_visible);
  }

  async deleteExpiredContent(userId: string): Promise<number> {
    const items = await this.getQueueItems(userId);
    const expiredItems = items.filter(item => item.computed_status === 'expired' && item.auto_delete_on_expire);

    let deletedCount = 0;
    for (const item of expiredItems) {
      const success = await this.deleteQueueItem(item.id);
      if (success) deletedCount++;
    }

    return deletedCount;
  }

  async addQueueItem(item: QueueItemInsert): Promise<QueueItem | null> {
    const { data, error } = await supabase
      .from('queue_items')
      .insert(item)
      .select()
      .single();

    if (error) {
      console.error('Error adding queue item:', error);
      return null;
    }

    return data;
  }

  async updateQueueItem(id: string, updates: QueueItemUpdate): Promise<QueueItem | null> {
    const { data, error } = await supabase
      .from('queue_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating queue item:', error);
      return null;
    }

    return data;
  }

  async deleteQueueItem(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('queue_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting queue item:', error);
      return false;
    }

    return true;
  }

  async reorderQueueItems(userId: string, itemIds: string[]): Promise<boolean> {
    const updates = itemIds.map((id, index) => ({
      id,
      order_index: index,
    }));

    for (const update of updates) {
      await supabase
        .from('queue_items')
        .update({ order_index: update.order_index })
        .eq('id', update.id)
        .eq('user_id', userId);
    }

    return true;
  }

  async getActiveQueueItem(userId: string): Promise<QueueItem | null> {
    const { data, error } = await supabase
      .from('queue_items')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('order_index', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching active queue item:', error);
      return null;
    }

    return data;
  }

  subscribeToQueueChanges(userId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel('queue_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_items',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const supabaseQueueService = new SupabaseQueueService();
