import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type QueueItem = Database['public']['Tables']['queue_items']['Row'];
type QueueItemInsert = Database['public']['Tables']['queue_items']['Insert'];
type QueueItemUpdate = Database['public']['Tables']['queue_items']['Update'];

class SupabaseQueueService {
  async getQueueItems(userId: string): Promise<QueueItem[]> {
    const { data, error } = await supabase
      .from('queue_items')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching queue items:', error);
      return [];
    }

    return data || [];
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
