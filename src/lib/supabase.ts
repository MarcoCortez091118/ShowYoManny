import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          roles: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          display_name?: string | null;
          roles?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          roles?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      kiosks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          location: string | null;
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          location?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          location?: string | null;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
      };
      queue_items: {
        Row: {
          id: string;
          user_id: string;
          kiosk_id: string | null;
          media_url: string;
          media_type: 'image' | 'video';
          thumbnail_url: string | null;
          title: string | null;
          duration: number;
          order_index: number;
          status: 'pending' | 'active' | 'completed';
          scheduled_start: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kiosk_id?: string | null;
          media_url: string;
          media_type: 'image' | 'video';
          thumbnail_url?: string | null;
          title?: string | null;
          duration?: number;
          order_index?: number;
          status?: 'pending' | 'active' | 'completed';
          scheduled_start?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kiosk_id?: string | null;
          media_url?: string;
          media_type?: 'image' | 'video';
          thumbnail_url?: string | null;
          title?: string | null;
          duration?: number;
          order_index?: number;
          status?: 'pending' | 'active' | 'completed';
          scheduled_start?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      display_settings: {
        Row: {
          id: string;
          user_id: string;
          border_theme: string;
          transition_style: string;
          logo_enabled: boolean;
          logo_url: string | null;
          background_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          border_theme?: string;
          transition_style?: string;
          logo_enabled?: boolean;
          logo_url?: string | null;
          background_color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          border_theme?: string;
          transition_style?: string;
          logo_enabled?: boolean;
          logo_url?: string | null;
          background_color?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          details: Record<string, any> | null;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          details?: Record<string, any> | null;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          details?: Record<string, any> | null;
          ip_address?: string | null;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          status: 'pending' | 'completed' | 'failed';
          payment_method: string | null;
          stripe_payment_id: string | null;
          plan_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          currency?: string;
          status?: 'pending' | 'completed' | 'failed';
          payment_method?: string | null;
          stripe_payment_id?: string | null;
          plan_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          status?: 'pending' | 'completed' | 'failed';
          payment_method?: string | null;
          stripe_payment_id?: string | null;
          plan_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
