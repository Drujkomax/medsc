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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          company: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          last_contact: string | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_contact?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          last_contact?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      conversion_analytics: {
        Row: {
          conversion_rate: number | null
          conversions_count: number | null
          created_at: string | null
          date: string
          id: string
          product_id: string | null
          quote_requests_count: number | null
          revenue: number | null
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          conversion_rate?: number | null
          conversions_count?: number | null
          created_at?: string | null
          date: string
          id?: string
          product_id?: string | null
          quote_requests_count?: number | null
          revenue?: number | null
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          conversion_rate?: number | null
          conversions_count?: number | null
          created_at?: string | null
          date?: string
          id?: string
          product_id?: string | null
          quote_requests_count?: number | null
          revenue?: number | null
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conversion_analytics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          amount: number | null
          client_id: string | null
          close_date: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          probability: number | null
          stage: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          client_id?: string | null
          close_date?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          stage?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          client_id?: string | null
          close_date?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          probability?: number | null
          stage?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_activity: {
        Row: {
          action_type: string
          created_at: string | null
          date: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          session_duration: number | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          date?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          session_duration?: number | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          date?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          session_duration?: number | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lead_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          lead_id: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          lead_id: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          archived_by: string | null
          assigned_by: string | null
          assigned_to: string | null
          closed_at: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          source: string | null
          stage: string
          updated_at: string
          value: number | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          stage?: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string | null
          stage?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: Json
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: Json
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: Json
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          archived_by: string | null
          category: string
          competitor_price: number | null
          conversion_rate: number | null
          country: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: Json
          features: Json | null
          id: string
          images: Json | null
          in_stock: boolean
          name: Json
          performance_score: number | null
          price: string | null
          price_history: Json | null
          quote_requests_count: number | null
          revenue_attributed: number | null
          status: string
          updated_at: string
          updated_by: string | null
          views_count: number | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          category: string
          competitor_price?: number | null
          conversion_rate?: number | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description: Json
          features?: Json | null
          id?: string
          images?: Json | null
          in_stock?: boolean
          name: Json
          performance_score?: number | null
          price?: string | null
          price_history?: Json | null
          quote_requests_count?: number | null
          revenue_attributed?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          views_count?: number | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          category?: string
          competitor_price?: number | null
          conversion_rate?: number | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: Json
          features?: Json | null
          id?: string
          images?: Json | null
          in_stock?: boolean
          name?: Json
          performance_score?: number | null
          price?: string | null
          price_history?: Json | null
          quote_requests_count?: number | null
          revenue_attributed?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_invites: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          expires_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          expires_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          used?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invite: {
        Args: { invite_id: string; user_password: string }
        Returns: Json
      }
      archive_lead: {
        Args: { lead_id: string; user_id: string }
        Returns: undefined
      }
      archive_product: {
        Args: { product_id: string; user_id: string }
        Returns: undefined
      }
      create_first_director: {
        Args: { director_email: string }
        Returns: Json
      }
      create_user_invite: {
        Args: {
          invite_email: string
          invite_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: Json
      }
      get_employee_performance_metrics: {
        Args: { p_end_date?: string; p_start_date?: string; p_user_id: string }
        Returns: {
          activity_breakdown: Json
          daily_average: number
          most_active_day: string
          total_actions: number
        }[]
      }
      get_pending_invites: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_level: {
        Args: {
          _min_role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_product_quote_requests: {
        Args: { product_id: string }
        Returns: undefined
      }
      increment_product_views: {
        Args: { product_id: string }
        Returns: undefined
      }
      log_employee_activity: {
        Args: {
          p_action_type: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type?: string
          p_session_duration?: number
        }
        Returns: string
      }
      register_specific_director: {
        Args: { director_email: string; user_id: string }
        Returns: Json
      }
      unarchive_product: {
        Args: { product_id: string }
        Returns: undefined
      }
      update_conversion_analytics: {
        Args: { p_date?: string; p_product_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "director" | "sales_manager" | "salesperson"
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
      app_role: ["admin", "user", "director", "sales_manager", "salesperson"],
    },
  },
} as const
