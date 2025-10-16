import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { supabaseDisplaySettingsService } from "@/services/supabaseDisplaySettingsService";

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

interface UseDisplaySettingsResult {
  settings: DisplaySettings;
  updateSettings: (partial: Partial<DisplaySettings>) => Promise<void>;
  isLoading: boolean;
}

const DEFAULT: DisplaySettings = {
  screenWidth: 2048,
  screenHeight: 2432,
  photoDisplayDurationSeconds: 10,
  minVideoDurationSeconds: 5,
  maxVideoDurationSeconds: 60,
  maxImageFileSizeMB: 25,
  maxVideoFileSizeMB: 600,
  recommendedImageFormat: "PNG or high-quality JPEG",
  recommendedVideoFormat: "MP4 (H.264) or MOV",
};

export function useDisplaySettings(): UseDisplaySettingsResult {
  const [settings, setSettings] = useState<DisplaySettings>(DEFAULT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      const data = await supabaseDisplaySettingsService.getDisplaySettings(user.id);
      if (data) {
        setSettings({
          screenWidth: data.screen_width || DEFAULT.screenWidth,
          screenHeight: data.screen_height || DEFAULT.screenHeight,
          photoDisplayDurationSeconds: data.photo_display_duration_seconds || DEFAULT.photoDisplayDurationSeconds,
          minVideoDurationSeconds: data.min_video_duration_seconds || DEFAULT.minVideoDurationSeconds,
          maxVideoDurationSeconds: data.max_video_duration_seconds || DEFAULT.maxVideoDurationSeconds,
          maxImageFileSizeMB: data.max_image_file_size_mb || DEFAULT.maxImageFileSizeMB,
          maxVideoFileSizeMB: data.max_video_file_size_mb || DEFAULT.maxVideoFileSizeMB,
          recommendedImageFormat: data.recommended_image_format || DEFAULT.recommendedImageFormat,
          recommendedVideoFormat: data.recommended_video_format || DEFAULT.recommendedVideoFormat,
        });
      }
      setIsLoading(false);
    };

    loadSettings();

    const unsubscribe = supabaseDisplaySettingsService.subscribeToSettingsChanges(
      '',
      () => {
        loadSettings();
      }
    );

    return unsubscribe;
  }, []);

  const updateSettings = useCallback(async (partial: Partial<DisplaySettings>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user found when updating display settings');
      throw new Error('User not authenticated');
    }

    const updates: any = {};
    if (partial.screenWidth !== undefined) updates.screen_width = partial.screenWidth;
    if (partial.screenHeight !== undefined) updates.screen_height = partial.screenHeight;
    if (partial.photoDisplayDurationSeconds !== undefined) updates.photo_display_duration_seconds = partial.photoDisplayDurationSeconds;
    if (partial.minVideoDurationSeconds !== undefined) updates.min_video_duration_seconds = partial.minVideoDurationSeconds;
    if (partial.maxVideoDurationSeconds !== undefined) updates.max_video_duration_seconds = partial.maxVideoDurationSeconds;
    if (partial.maxImageFileSizeMB !== undefined) updates.max_image_file_size_mb = partial.maxImageFileSizeMB;
    if (partial.maxVideoFileSizeMB !== undefined) updates.max_video_file_size_mb = partial.maxVideoFileSizeMB;
    if (partial.recommendedImageFormat !== undefined) updates.recommended_image_format = partial.recommendedImageFormat;
    if (partial.recommendedVideoFormat !== undefined) updates.recommended_video_format = partial.recommendedVideoFormat;

    console.log('Updating display settings with:', updates);

    const result = await supabaseDisplaySettingsService.updateDisplaySettings(user.id, updates);
    if (result) {
      console.log('Display settings updated successfully:', result);
      setSettings(prev => ({ ...prev, ...partial }));
    } else {
      console.error('Failed to update display settings');
      throw new Error('Failed to update display settings');
    }
  }, []);

  return { settings, updateSettings, isLoading };
}
