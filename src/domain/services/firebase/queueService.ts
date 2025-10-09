import { FirebaseApiClient, firebaseApiClient } from "@/integrations/firebase/apiClient";
import { firebaseAuthService } from "./authService";
import { OrderRecord } from "./orderService";

export interface QueueItemRecord {
  id: string;
  order_id: string;
  queue_position: number;
  is_active: boolean;
  created_at: string;
  order?: OrderRecord;
}

export interface EnqueueOrderInput {
  orderId: string;
  queuePosition?: number;
  isActive?: boolean;
}

export interface ReorderQueuePayload {
  queue: Array<{ id: string; queue_position: number }>;
}

export class FirebaseQueueService {
  constructor(
    private readonly api: FirebaseApiClient,
    private readonly auth = firebaseAuthService
  ) {}

  private get token(): string | null {
    return this.auth.token;
  }

  async fetchQueue(): Promise<QueueItemRecord[]> {
    return this.api.request<QueueItemRecord[]>("queue", {
      method: "GET",
      token: this.token,
    });
  }

  async enqueueOrder(input: EnqueueOrderInput): Promise<QueueItemRecord> {
    return this.api.request<QueueItemRecord>("queue", {
      method: "POST",
      body: input,
      token: this.token,
    });
  }

  async removeOrder(orderId: string): Promise<void> {
    await this.api.request(`queue/${orderId}`, {
      method: "DELETE",
      token: this.token,
    });
  }

  async updateQueueOrder(payload: ReorderQueuePayload): Promise<void> {
    await this.api.request("queue/reorder", {
      method: "PATCH",
      body: payload,
      token: this.token,
    });
  }
}

export const firebaseQueueService = new FirebaseQueueService(firebaseApiClient);
