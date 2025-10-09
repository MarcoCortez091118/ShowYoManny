import { FirebaseApiClient, firebaseApiClient } from "@/integrations/firebase/apiClient";
import { firebaseAuthService } from "./authService";

export type OrderStatus = "pending" | "completed" | "refunded" | "cancelled";
export type ModerationStatus = "pending" | "approved" | "rejected";
export type DisplayStatus = "pending" | "queued" | "active" | "completed" | "rejected";

export interface OrderRecord {
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

export interface UpdateOrderInput {
  display_status?: DisplayStatus;
  moderation_status?: ModerationStatus;
  status?: OrderStatus;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  timer_loop_enabled?: boolean;
  timer_loop_minutes?: number | null;
  border_id?: string;
  play_count?: number;
  last_played_at?: string | null;
}

export class FirebaseOrderService {
  constructor(
    private readonly api: FirebaseApiClient,
    private readonly auth = firebaseAuthService
  ) {}

  private get token(): string | null {
    return this.auth.token;
  }

  async createOrder(input: CreateOrderInput): Promise<OrderRecord> {
    return this.api.request<OrderRecord>("orders", {
      method: "POST",
      body: input,
      token: this.token,
    });
  }

  async getOrderById(id: string): Promise<OrderRecord | null> {
    return this.api.request<OrderRecord | null>(`orders/${id}`, {
      method: "GET",
      token: this.token,
    });
  }

  async updateOrder(id: string, input: UpdateOrderInput): Promise<OrderRecord> {
    return this.api.request<OrderRecord>(`orders/${id}`, {
      method: "PATCH",
      body: input,
      token: this.token,
    });
  }

  async deleteOrder(id: string): Promise<void> {
    await this.api.request(`orders/${id}`, {
      method: "DELETE",
      token: this.token,
    });
  }

  async listPendingOrders(): Promise<OrderRecord[]> {
    return this.api.request<OrderRecord[]>("orders", {
      method: "GET",
      query: {
        moderationStatus: "pending",
        isAdminContent: false,
      },
      token: this.token,
    });
  }

  async listPaidOrders(): Promise<OrderRecord[]> {
    return this.api.request<OrderRecord[]>("orders", {
      method: "GET",
      query: { status: "completed" },
      token: this.token,
    });
  }

  async listApprovedOrders(): Promise<OrderRecord[]> {
    return this.api.request<OrderRecord[]>("orders", {
      method: "GET",
      query: { moderationStatus: "approved" },
      token: this.token,
    });
  }

  async reportPlayCompletion(orderId: string, payload: { startedAt: string; completedAt: string }): Promise<void> {
    await this.api.request(`orders/${orderId}/plays`, {
      method: "POST",
      body: payload,
      token: this.token,
    });
  }
}

export const firebaseOrderService = new FirebaseOrderService(firebaseApiClient);
