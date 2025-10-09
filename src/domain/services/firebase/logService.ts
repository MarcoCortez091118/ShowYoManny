import { FirebaseApiClient, firebaseApiClient } from "@/integrations/firebase/apiClient";
import { firebaseAuthService } from "./authService";

export interface PlayLogRecord {
  id: string;
  created_at: string;
  order_id: string;
  file_name: string;
  user_email: string;
  completed_at: string;
}

export interface SystemHealthSnapshot {
  playlistGeneratedAt: string;
  playlistVersion: number;
  totalPlaysToday: number;
}

export class FirebaseLogService {
  constructor(
    private readonly api: FirebaseApiClient,
    private readonly auth = firebaseAuthService
  ) {}

  private get token(): string | null {
    return this.auth.token;
  }

  async fetchRecentPlays(limit = 100): Promise<PlayLogRecord[]> {
    return this.api.request<PlayLogRecord[]>("logs/plays", {
      method: "GET",
      query: { limit },
      token: this.token,
    });
  }

  async fetchSystemHealth(): Promise<SystemHealthSnapshot> {
    return this.api.request<SystemHealthSnapshot>("logs/system-health", {
      method: "GET",
      token: this.token,
    });
  }
}

export const firebaseLogService = new FirebaseLogService(firebaseApiClient);
