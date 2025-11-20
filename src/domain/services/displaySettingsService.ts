import { borderService } from "./borderService";

export interface DisplaySettings {
  screenWidth: number;
  screenHeight: number;
  photoDisplayDurationSeconds: number;
  minVideoDurationSeconds: number;
  maxVideoDurationSeconds: number;
  maxImageFileSizeMB: number;
  maxVideoFileSizeMB: number;
  recommendedImageFormat: string;
  recommendedVideoFormat: string;
}

type DisplaySettingsListener = (settings: DisplaySettings) => void;

interface PersistedSettings {
  screenWidth?: number;
  screenHeight?: number;
  photoDisplayDurationSeconds?: number;
  minVideoDurationSeconds?: number;
  maxVideoDurationSeconds?: number;
  maxImageFileSizeMB?: number;
  maxVideoFileSizeMB?: number;
  recommendedImageFormat?: string;
  recommendedVideoFormat?: string;
}

const STORAGE_KEY = "showyo:display-settings";

const DEFAULT_SETTINGS: DisplaySettings = {
  screenWidth: 2048,
  screenHeight: 2432,
  photoDisplayDurationSeconds: 10,
  minVideoDurationSeconds: 5,
  maxVideoDurationSeconds: 10,
  maxImageFileSizeMB: 25,
  maxVideoFileSizeMB: 100,
  recommendedImageFormat: "PNG or high-quality JPEG",
  recommendedVideoFormat: "MP4 (H.264) or MOV",
};

const safeWindow = typeof window !== "undefined" ? window : undefined;

class DisplaySettingsService {
  private listeners = new Set<DisplaySettingsListener>();
  private cache: DisplaySettings | null = null;

  private readFromStorage(): PersistedSettings | null {
    if (!safeWindow?.localStorage) {
      return null;
    }

    try {
      const raw = safeWindow.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      return JSON.parse(raw) as PersistedSettings;
    } catch (error) {
      console.warn("Failed to read display settings from storage", error);
      return null;
    }
  }

  private writeToStorage(settings: DisplaySettings) {
    if (!safeWindow?.localStorage) {
      return;
    }

    try {
      const payload: PersistedSettings = { ...settings };
      safeWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn("Failed to persist display settings", error);
    }
  }

  private hydrate(): DisplaySettings {
    if (this.cache) {
      return this.cache;
    }

    const stored = this.readFromStorage();
    if (!stored) {
      this.cache = { ...DEFAULT_SETTINGS };
      return this.cache;
    }

    this.cache = {
      ...DEFAULT_SETTINGS,
      ...stored,
    };

    return this.cache;
  }

  getSettings(): DisplaySettings {
    return { ...this.hydrate() };
  }

  getAspectRatio(): number {
    const { screenWidth, screenHeight } = this.hydrate();
    return screenWidth / screenHeight;
  }

  getScreenResolutionLabel(): string {
    const { screenWidth, screenHeight } = this.hydrate();
    return `${screenWidth} × ${screenHeight}`;
  }

  getMaxFileSizeBytes(type: "image" | "video"): number {
    const settings = this.hydrate();
    const sizeMB = type === "image" ? settings.maxImageFileSizeMB : settings.maxVideoFileSizeMB;
    return Math.round(sizeMB * 1024 * 1024);
  }

  getBorderSafeAreaCopy(): string {
    const totalBorders = borderService.getAll().length;
    if (totalBorders === 0) {
      return "No borders configured yet.";
    }

    return `${totalBorders} curated borders available. Content will be scaled to ${this.getScreenResolutionLabel()} to avoid stretching within borders.`;
  }

  updateSettings(partial: Partial<DisplaySettings>) {
    const merged = {
      ...this.hydrate(),
      ...partial,
    };

    this.cache = merged;
    this.writeToStorage(merged);
    this.notify();
  }

  subscribe(listener: DisplaySettingsListener): () => void {
    this.listeners.add(listener);
    listener(this.getSettings());

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snapshot = this.getSettings();
    this.listeners.forEach((listener) => listener(snapshot));
  }
}

export const displaySettingsService = new DisplaySettingsService();
