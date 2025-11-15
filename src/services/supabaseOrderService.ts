import { supabase } from '@/lib/supabase';

export type OrderStatus = "pending" | "completed" | "refunded" | "cancelled";
export type ModerationStatus = "pending" | "approved" | "rejected";
export type DisplayStatus = "pending" | "queued" | "active" | "completed" | "rejected";

export interface QueueItem {
  id: string;
  user_email: string;
  pricing_option_id: string;
  price_cents: number;
  file_name: string;
  file_type: string;
  file_path: string;
  border_id: string;
  duration_seconds: number;
  status: OrderStatus;
  moderation_status: ModerationStatus;
  display_status: DisplayStatus;
  is_admin_content: boolean;
  created_at: string;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  timer_loop_enabled?: boolean;
  timer_loop_minutes?: number | null;
  max_plays?: number | null;
  play_count?: number | null;
  repeat_frequency_per_day?: number | null;
  auto_complete_after_play?: boolean;
  queue_position?: number | null;
  last_played_at?: string | null;
}

export interface CreateOrderInput {
  userEmail: string;
  pricingOptionId: string;
  priceCents: number;
  fileName: string;
  fileType: string;
  filePath: string;
  borderId: string;
  durationSeconds: number;
  isAdminContent: boolean;
  moderationStatus?: ModerationStatus;
  status?: OrderStatus;
  displayStatus?: DisplayStatus;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  timerLoopEnabled?: boolean;
  timerLoopMinutes?: number | null;
  maxPlays?: number | null;
  repeatFrequencyPerDay?: number | null;
  autoCompleteAfterPlay?: boolean;
}

class SupabaseOrderService {
  async createOrder(input: CreateOrderInput): Promise<QueueItem> {
    const { data, error } = await supabase
      .from('queue_items')
      .insert({
        user_email: input.userEmail,
        pricing_option_id: input.pricingOptionId,
        price_cents: input.priceCents,
        file_name: input.fileName,
        file_type: input.fileType,
        file_path: input.filePath,
        border_id: input.borderId,
        duration_seconds: input.durationSeconds,
        is_admin_content: input.isAdminContent,
        moderation_status: input.moderationStatus || 'pending',
        status: input.status || 'pending',
        display_status: input.displayStatus || 'pending',
        scheduled_start: input.scheduledStart,
        scheduled_end: input.scheduledEnd,
        timer_loop_enabled: input.timerLoopEnabled || false,
        timer_loop_minutes: input.timerLoopMinutes,
        max_plays: input.maxPlays || 1,
        play_count: 0,
        repeat_frequency_per_day: input.repeatFrequencyPerDay,
        auto_complete_after_play: input.autoCompleteAfterPlay !== undefined ? input.autoCompleteAfterPlay : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      throw new Error(`Failed to create order: ${error.message}`);
    }

    return data;
  }

  async getOrderById(id: string): Promise<QueueItem | null> {
    const { data, error } = await supabase
      .from('queue_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching order:', error);
      throw new Error(`Failed to fetch order: ${error.message}`);
    }

    return data;
  }

  async updateOrder(id: string, updates: Partial<QueueItem>): Promise<QueueItem> {
    const { data, error } = await supabase
      .from('queue_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      throw new Error(`Failed to update order: ${error.message}`);
    }

    return data;
  }

  async deleteOrder(id: string): Promise<void> {
    const { error } = await supabase
      .from('queue_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting order:', error);
      throw new Error(`Failed to delete order: ${error.message}`);
    }
  }

  async listPendingOrders(): Promise<QueueItem[]> {
    const { data, error } = await supabase
      .from('queue_items')
      .select('*')
      .eq('moderation_status', 'pending')
      .eq('is_admin_content', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending orders:', error);
      throw new Error(`Failed to fetch pending orders: ${error.message}`);
    }

    return data || [];
  }

  async listPaidOrders(): Promise<QueueItem[]> {
    const { data, error } = await supabase
      .from('queue_items')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching paid orders:', error);
      throw new Error(`Failed to fetch paid orders: ${error.message}`);
    }

    return data || [];
  }

  async listApprovedOrders(): Promise<QueueItem[]> {
    const { data, error } = await supabase
      .from('queue_items')
      .select('*')
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching approved orders:', error);
      throw new Error(`Failed to fetch approved orders: ${error.message}`);
    }

    return data || [];
  }

  async reportPlayCompletion(orderId: string, payload: { startedAt: string; completedAt: string }): Promise<void> {
    const { data: order } = await supabase
      .from('queue_items')
      .select('play_count, max_plays, auto_complete_after_play')
      .eq('id', orderId)
      .single();

    if (!order) {
      throw new Error('Order not found');
    }

    const newPlayCount = (order.play_count || 0) + 1;
    const updates: Partial<QueueItem> = {
      play_count: newPlayCount,
      last_played_at: payload.completedAt,
    };

    if (order.max_plays && newPlayCount >= order.max_plays && order.auto_complete_after_play) {
      updates.display_status = 'completed';
      updates.status = 'completed';
    }

    await this.updateOrder(orderId, updates);
  }
}

export const supabaseOrderService = new SupabaseOrderService();
