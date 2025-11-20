import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type DisplaySettings = Database['public']['Tables']['display_settings']['Row'];
type DisplaySettingsUpdate = Database['public']['Tables']['display_settings']['Update'];

class SupabaseDisplaySettingsService {
  async getDisplaySettings(userId: string): Promise<DisplaySettings | null> {
    const { data, error } = await supabase
      .from('display_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching display settings:', error);
      return null;
    }

    if (!data) {
      return await this.createDefaultSettings(userId);
    }

    return data;
  }

  async createDefaultSettings(userId: string): Promise<DisplaySettings | null> {
    const defaultSettings = {
      user_id: userId,
      border_theme: 'modern-gradient',
      transition_style: 'fade',
      logo_enabled: false,
      background_color: '#000000',
      screen_width: 2048,
      screen_height: 2432,
      photo_display_duration_seconds: 10,
      min_video_duration_seconds: 5,
      max_video_duration_seconds: 10,
      max_image_file_size_mb: 25,
      max_video_file_size_mb: 100,
      recommended_image_format: 'PNG or high-quality JPEG',
      recommended_video_format: 'MP4 (H.264) or MOV',
    };

    const { data, error } = await supabase
      .from('display_settings')
      .insert(defaultSettings)
      .select()
      .single();

    if (error) {
      console.error('Error creating display settings:', error);
      return null;
    }

    return data;
  }

  async updateDisplaySettings(
    userId: string,
    updates: DisplaySettingsUpdate
  ): Promise<DisplaySettings | null> {
    console.log('[updateDisplaySettings] Starting update for userId:', userId);
    console.log('[updateDisplaySettings] Updates to apply:', updates);

    // Primero verificar si existe el registro
    console.log('[updateDisplaySettings] Checking if settings exist...');
    const existing = await this.getDisplaySettings(userId);
    if (!existing) {
      console.error('[updateDisplaySettings] No display settings found for user:', userId);
      return null;
    }
    console.log('[updateDisplaySettings] Found existing settings:', existing);

    console.log('[updateDisplaySettings] Attempting to update in Supabase...');
    const { data, error } = await supabase
      .from('display_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[updateDisplaySettings] Supabase error:', error);
      console.error('[updateDisplaySettings] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return null;
    }

    console.log('[updateDisplaySettings] Update successful:', data);
    return data;
  }

  subscribeToSettingsChanges(userId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel('settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'display_settings',
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

export const supabaseDisplaySettingsService = new SupabaseDisplaySettingsService();
