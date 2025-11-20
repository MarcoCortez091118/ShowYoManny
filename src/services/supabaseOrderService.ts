import { supabase } from '@/lib/supabase';

export type OrderStatus = "pending" | "completed" | "refunded" | "cancelled";

export interface QueueItem {
  id: string;
  user_id: string | null;
  kiosk_id?: string | null;
  media_url: string;
  media_type: string;
  thumbnail_url?: string | null;
  title?: string | null;
  duration: number;
  order_index: number;
  status: OrderStatus;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  created_at: string;
  updated_at: string;
  border_id?: string | null;
  timer_loop_enabled: boolean;
  timer_loop_minutes?: number | null;
  file_name?: string | null;
  metadata?: Record<string, any> | null;
  timer_loop_automatic: boolean;
  auto_delete_on_expire: boolean;
  published_at?: string | null;
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
  moderationStatus?: string;
  status?: OrderStatus;
  displayStatus?: string;
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
    // Get current user session
    const { data: { session } } = await supabase.auth.getSession();

    // Use authenticated user ID or null for public/guest users
    const userId = session?.user?.id || null;

    // Normalize media_type to "image" or "video" (remove MIME type)
    const normalizedMediaType = input.fileType.startsWith('image/') ? 'image' :
                                 input.fileType.startsWith('video/') ? 'video' :
                                 input.fileType;

    // Prepare metadata with order details
    const metadata = {
      user_email: input.userEmail,
      pricing_option_id: input.pricingOptionId,
      price_cents: input.priceCents,
      is_admin_content: input.isAdminContent,
      moderation_status: input.moderationStatus || 'pending',
      display_status: input.displayStatus || 'pending',
      max_plays: input.maxPlays || 1,
      play_count: 0,
      repeat_frequency_per_day: input.repeatFrequencyPerDay,
      auto_complete_after_play: input.autoCompleteAfterPlay !== undefined ? input.autoCompleteAfterPlay : true,
      original_mime_type: input.fileType, // Store full MIME type in metadata
    };

    const { data, error } = await supabase
      .from('queue_items')
      .insert({
        user_id: userId,
        media_url: input.filePath,
        media_type: normalizedMediaType,
        title: input.fileName,
        duration: input.durationSeconds,
        status: input.status || 'pending',
        border_id: input.borderId || null,
        scheduled_start: input.scheduledStart,
        scheduled_end: input.scheduledEnd,
        timer_loop_enabled: input.timerLoopEnabled || false,
        timer_loop_minutes: input.timerLoopMinutes,
        file_name: input.fileName,
        metadata: metadata,
        order_index: 0,
        timer_loop_automatic: false,
        auto_delete_on_expire: true,
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
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
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
      .eq('status', 'pending')
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
      .select('metadata')
      .eq('id', orderId)
      .single();

    if (!order) {
      throw new Error('Order not found');
    }

    const metadata = order.metadata || {};
    const playCount = (metadata.play_count || 0) + 1;
    const maxPlays = metadata.max_plays || 1;
    const autoComplete = metadata.auto_complete_after_play !== false;

    const updates: Partial<QueueItem> = {
      metadata: {
        ...metadata,
        play_count: playCount,
        last_played_at: payload.completedAt,
      },
    };

    if (maxPlays && playCount >= maxPlays && autoComplete) {
      updates.status = 'completed';
      if (updates.metadata) {
        updates.metadata.display_status = 'completed';
      }
    }

    await this.updateOrder(orderId, updates);
  }
}

export const supabaseOrderService = new SupabaseOrderService();
