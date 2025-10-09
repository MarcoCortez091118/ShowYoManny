import { FirebaseApiClient, firebaseApiClient } from "@/integrations/firebase/apiClient";
import { firebaseAuthService } from "./authService";

export interface PlaylistOverlay {
  border_id: string;
  z: number;
}

export interface PlaylistRepeatRules {
  mode: "once" | "interval" | "unlimited";
  n: number | null;
  interval_minutes: number | null;
}

export interface PlaylistCaps {
  max_plays_per_day: number;
  current_plays: number;
}

export interface PlaylistItem {
  id: string;
  type: "photo" | "video";
  src: string;
  duration_sec: number;
  fit_mode: "fit" | "fill";
  overlay: PlaylistOverlay | null;
  priority: "paid" | "admin" | "house";
  window: {
    start_at: string | null;
    end_at: string | null;
  };
  repeat: PlaylistRepeatRules;
  caps: PlaylistCaps;
  delete_after_play: boolean;
  pricing_option_id?: string;
  file_name: string;
  user_email: string;
}

export interface PlaylistResponse {
  version: number;
  generated_at: string;
  timezone: string;
  canvas: { width: number; height: number };
  items: PlaylistItem[];
}

export interface ReportPlayPayload {
  itemId: string;
  startedAt: string;
  completedAt: string;
  success: boolean;
}

export class FirebaseKioskService {
  constructor(
    private readonly api: FirebaseApiClient,
    private readonly auth = firebaseAuthService
  ) {}

  private get token(): string | null {
    return this.auth.token;
  }

  async fetchPlaylist(kioskId?: string | null): Promise<PlaylistResponse> {
    return this.api.request<PlaylistResponse>("kiosk/playlist", {
      method: "GET",
      query: kioskId ? { kioskId } : undefined,
      token: this.token,
    });
  }

  async reportPlay(payload: ReportPlayPayload): Promise<void> {
    await this.api.request("kiosk/report-play", {
      method: "POST",
      body: {
        item_id: payload.itemId,
        started_at: payload.startedAt,
        completed_at: payload.completedAt,
        success: payload.success,
      },
      token: this.token,
    });
  }
}

export const firebaseKioskService = new FirebaseKioskService(firebaseApiClient);
