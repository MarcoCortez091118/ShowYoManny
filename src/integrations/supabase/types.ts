export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      content_queue: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          max_repeats: number | null
          next_repeat_at: string | null
          order_id: string
          queue_position: number
          repeat_count: number | null
          repeat_enabled: boolean | null
          repeat_interval_minutes: number | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_repeats?: number | null
          next_repeat_at?: string | null
          order_id: string
          queue_position: number
          repeat_count?: number | null
          repeat_enabled?: boolean | null
          repeat_interval_minutes?: number | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          max_repeats?: number | null
          next_repeat_at?: string | null
          order_id?: string
          queue_position?: number
          repeat_count?: number | null
          repeat_enabled?: boolean | null
          repeat_interval_minutes?: number | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_queue_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "display_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_queue_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      kiosk_sync_state: {
        Row: {
          created_at: string
          current_content_id: string | null
          current_index: number
          id: string
          last_advance_time: string
          sync_timestamp: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_content_id?: string | null
          current_index?: number
          id?: string
          last_advance_time?: string
          sync_timestamp?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_content_id?: string | null
          current_index?: number
          id?: string
          last_advance_time?: string
          sync_timestamp?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kiosk_sync_state_current_content_id_fkey"
            columns: ["current_content_id"]
            isOneToOne: false
            referencedRelation: "display_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kiosk_sync_state_current_content_id_fkey"
            columns: ["current_content_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          auto_complete_after_play: boolean | null
          auto_delete_after_end: boolean | null
          auto_delete_at: string | null
          border_id: string | null
          completed_by_system: boolean | null
          created_at: string
          custom_duration_seconds: number | null
          display_completed_at: string | null
          display_started_at: string | null
          display_status: string | null
          duration_seconds: number | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          is_admin_content: boolean | null
          max_plays: number | null
          max_repeats: number | null
          moderation_reason: string | null
          moderation_status: string | null
          paid_at: string | null
          play_count: number | null
          played_at: string | null
          price_cents: number
          pricing_option_id: string
          repeat_count: number | null
          repeat_enabled: boolean | null
          repeat_frequency_per_day: number | null
          repeat_interval_minutes: number | null
          scheduled_end: string | null
          scheduled_start: string | null
          start_time: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          timer_loop_enabled: boolean
          timer_loop_minutes: number | null
          updated_at: string
          user_email: string
          user_id: string | null
          video_duration_seconds: number | null
        }
        Insert: {
          auto_complete_after_play?: boolean | null
          auto_delete_after_end?: boolean | null
          auto_delete_at?: string | null
          border_id?: string | null
          completed_by_system?: boolean | null
          created_at?: string
          custom_duration_seconds?: number | null
          display_completed_at?: string | null
          display_started_at?: string | null
          display_status?: string | null
          duration_seconds?: number | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_admin_content?: boolean | null
          max_plays?: number | null
          max_repeats?: number | null
          moderation_reason?: string | null
          moderation_status?: string | null
          paid_at?: string | null
          play_count?: number | null
          played_at?: string | null
          price_cents: number
          pricing_option_id: string
          repeat_count?: number | null
          repeat_enabled?: boolean | null
          repeat_frequency_per_day?: number | null
          repeat_interval_minutes?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          start_time?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          timer_loop_enabled?: boolean
          timer_loop_minutes?: number | null
          updated_at?: string
          user_email: string
          user_id?: string | null
          video_duration_seconds?: number | null
        }
        Update: {
          auto_complete_after_play?: boolean | null
          auto_delete_after_end?: boolean | null
          auto_delete_at?: string | null
          border_id?: string | null
          completed_by_system?: boolean | null
          created_at?: string
          custom_duration_seconds?: number | null
          display_completed_at?: string | null
          display_started_at?: string | null
          display_status?: string | null
          duration_seconds?: number | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_admin_content?: boolean | null
          max_plays?: number | null
          max_repeats?: number | null
          moderation_reason?: string | null
          moderation_status?: string | null
          paid_at?: string | null
          play_count?: number | null
          played_at?: string | null
          price_cents?: number
          pricing_option_id?: string
          repeat_count?: number | null
          repeat_enabled?: boolean | null
          repeat_frequency_per_day?: number | null
          repeat_interval_minutes?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          start_time?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          timer_loop_enabled?: boolean
          timer_loop_minutes?: number | null
          updated_at?: string
          user_email?: string
          user_id?: string | null
          video_duration_seconds?: number | null
        }
        Relationships: []
      }
      played_content_history: {
        Row: {
          border_id: string | null
          completed_at: string
          created_at: string
          file_name: string
          file_path: string
          first_played_at: string
          id: string
          last_played_at: string
          order_id: string
          play_count: number | null
          pricing_option_id: string
          revenue_cents: number
          user_email: string
        }
        Insert: {
          border_id?: string | null
          completed_at?: string
          created_at?: string
          file_name: string
          file_path: string
          first_played_at?: string
          id?: string
          last_played_at?: string
          order_id: string
          play_count?: number | null
          pricing_option_id: string
          revenue_cents: number
          user_email: string
        }
        Update: {
          border_id?: string | null
          completed_at?: string
          created_at?: string
          file_name?: string
          file_path?: string
          first_played_at?: string
          id?: string
          last_played_at?: string
          order_id?: string
          play_count?: number | null
          pricing_option_id?: string
          revenue_cents?: number
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "played_content_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "display_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "played_content_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_cleanup_queue: {
        Row: {
          cleaned_up: boolean | null
          created_at: string | null
          deleted_at: string | null
          file_path: string
          id: string
        }
        Insert: {
          cleaned_up?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          file_path: string
          id?: string
        }
        Update: {
          cleaned_up?: boolean | null
          created_at?: string | null
          deleted_at?: string | null
          file_path?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      display_queue: {
        Row: {
          border_id: string | null
          created_at: string | null
          display_completed_at: string | null
          display_started_at: string | null
          display_status: string | null
          file_name: string | null
          file_path: string | null
          file_type: string | null
          id: string | null
          max_plays: number | null
          moderation_status: string | null
          play_count: number | null
          pricing_option_id: string | null
          updated_at: string | null
        }
        Insert: {
          border_id?: string | null
          created_at?: string | null
          display_completed_at?: string | null
          display_started_at?: string | null
          display_status?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string | null
          max_plays?: number | null
          moderation_status?: string | null
          play_count?: number | null
          pricing_option_id?: string | null
          updated_at?: string | null
        }
        Update: {
          border_id?: string | null
          created_at?: string | null
          display_completed_at?: string | null
          display_started_at?: string | null
          display_status?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string | null
          max_plays?: number | null
          moderation_status?: string | null
          play_count?: number | null
          pricing_option_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_content: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
