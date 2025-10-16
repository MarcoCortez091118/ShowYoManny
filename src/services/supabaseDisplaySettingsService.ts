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
      max_video_duration_seconds: 60,
      max_image_file_size_mb: 25,
      max_video_file_size_mb: 600,
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
    // Primero verificar si existe el registro
    const existing = await this.getDisplaySettings(userId);
    if (!existing) {
      console.error('No display settings found for user');
      return null;
    }

    const { data, error } = await supabase
      .from('display_settings')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating display settings:', error);
      return null;
    }

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
