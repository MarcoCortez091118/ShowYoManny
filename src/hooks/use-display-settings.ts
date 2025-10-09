import { useEffect, useState, useCallback } from "react";
import { DisplaySettings, displaySettingsService } from "@/domain/services/displaySettingsService";

interface UseDisplaySettingsResult {
  settings: DisplaySettings;
  updateSettings: (partial: Partial<DisplaySettings>) => void;
}

const DEFAULT = displaySettingsService.getSettings();

export function useDisplaySettings(): UseDisplaySettingsResult {
  const [settings, setSettings] = useState<DisplaySettings>(DEFAULT);

  useEffect(() => {
    return displaySettingsService.subscribe(setSettings);
  }, []);

  const updateSettings = useCallback((partial: Partial<DisplaySettings>) => {
    displaySettingsService.updateSettings(partial);
  }, []);

  return { settings, updateSettings };
}
