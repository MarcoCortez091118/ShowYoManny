import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/supabase';

type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];
type ActivityLogInsert = Database['public']['Tables']['activity_logs']['Insert'];

class SupabaseLogService {
  async logActivity(log: ActivityLogInsert): Promise<void> {
    const { error } = await supabase
      .from('activity_logs')
      .insert(log);

    if (error) {
      console.error('Error logging activity:', error);
    }
  }

  async getUserLogs(userId: string, limit = 50): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user logs:', error);
      return [];
    }

    return data || [];
  }

  async getAllLogs(limit = 100): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching all logs:', error);
      return [];
    }

    return data || [];
  }

  async getLogsByAction(action: string, limit = 50): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('action', action)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching logs by action:', error);
      return [];
    }

    return data || [];
  }
}

export const supabaseLogService = new SupabaseLogService();
