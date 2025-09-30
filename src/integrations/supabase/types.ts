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
      categories: {
        Row: {
          created_at: string
          id: string
          name: Json
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: Json
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: Json
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
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
      contact_inquiries: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          status?: string
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
      deal_products: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          product_id: string
          quantity: number | null
          total_price: number | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          product_id: string
          quantity?: number | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          product_id?: string
          quantity?: number | null
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_products_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_services: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          quantity: number | null
          service_id: string
          total_price: number | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          quantity?: number | null
          service_id: string
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          quantity?: number | null
          service_id?: string
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_services_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          amount: number | null
          assigned_accountant: string | null
          assigned_engineer: string | null
          assigned_salesperson: string | null
          close_date: string | null
          created_at: string
          created_by: string | null
          deal_type: string | null
          id: string
          lead_id: string | null
          notes: string | null
          probability: number | null
          product_id: string | null
          service_id: string | null
          stage: string
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          assigned_accountant?: string | null
          assigned_engineer?: string | null
          assigned_salesperson?: string | null
          close_date?: string | null
          created_at?: string
          created_by?: string | null
          deal_type?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          probability?: number | null
          product_id?: string | null
          service_id?: string | null
          stage?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          assigned_accountant?: string | null
          assigned_engineer?: string | null
          assigned_salesperson?: string | null
          close_date?: string | null
          created_at?: string
          created_by?: string | null
          deal_type?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          probability?: number | null
          product_id?: string | null
          service_id?: string | null
          stage?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
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
      lead_activities: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          type: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          type: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
          budget_range: string | null
          city: string | null
          closed_at: string | null
          company: string | null
          created_at: string
          email: string | null
          equipment_interest: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          qualification_date: string | null
          qualified_by: string | null
          source: string | null
          stage: string
          timeline: string | null
          updated_at: string
          value: number | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          city?: string | null
          closed_at?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          equipment_interest?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          qualification_date?: string | null
          qualified_by?: string | null
          source?: string | null
          stage?: string
          timeline?: string | null
          updated_at?: string
          value?: number | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          city?: string | null
          closed_at?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          equipment_interest?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          qualification_date?: string | null
          qualified_by?: string | null
          source?: string | null
          stage?: string
          timeline?: string | null
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      service_categories: {
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
      services: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          currency: string | null
          description: Json
          features: Json | null
          id: string
          images: Json | null
          price: string | null
          status: string
          title: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description: Json
          features?: Json | null
          id?: string
          images?: Json | null
          price?: string | null
          status?: string
          title: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: Json
          features?: Json | null
          id?: string
          images?: Json | null
          price?: string | null
          status?: string
          title?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_contacts: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          facebook: string | null
          id: string
          instagram: string | null
          phone: string | null
          telegram: string | null
          updated_at: string
          whatsapp: string | null
          working_hours: string | null
          youtube: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          phone?: string | null
          telegram?: string | null
          updated_at?: string
          whatsapp?: string | null
          working_hours?: string | null
          youtube?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          facebook?: string | null
          id?: string
          instagram?: string | null
          phone?: string | null
          telegram?: string | null
          updated_at?: string
          whatsapp?: string | null
          working_hours?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      system_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          description: string | null
          details: Json | null
          id: string
          resolved_at: string | null
          severity: string
          status: string
          title: string
          triggered_by_log_id: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          description?: string | null
          details?: Json | null
          id?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
          triggered_by_log_id?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          description?: string | null
          details?: Json | null
          id?: string
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          triggered_by_log_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_alerts_triggered_by_log_id_fkey"
            columns: ["triggered_by_log_id"]
            isOneToOne: false
            referencedRelation: "system_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          category: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          level: string
          message: string
          stack_trace: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          level?: string
          message: string
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          level?: string
          message?: string
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          client_id: string | null
          comments: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          parent_task_id: string | null
          priority: string
          recurrence_end_date: string | null
          recurrence_interval: number | null
          recurrence_type: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          client_id?: string | null
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          priority?: string
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          client_id?: string | null
          comments?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          priority?: string
          recurrence_end_date?: string | null
          recurrence_interval?: number | null
          recurrence_type?: string | null
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
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
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
      assign_role_from_invite: {
        Args: { p_invite_id: string; p_user_id: string }
        Returns: Json
      }
      confirm_user_registration: {
        Args: { user_id: string }
        Returns: Json
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
      get_employee_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          id: string
        }[]
      }
      get_log_statistics: {
        Args: { p_end_date?: string; p_start_date?: string }
        Returns: {
          categories: Json
          date: string
          error_count: number
          info_count: number
          total_logs: number
          warn_count: number
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
      get_user_accessible_clients: {
        Args: { user_id: string }
        Returns: {
          company: string
          created_at: string
          created_by: string
          email: string
          id: string
          last_contact: string
          name: string
          notes: string
          phone: string
          updated_at: string
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
      log_system_event: {
        Args: {
          p_category: string
          p_details?: Json
          p_ip_address?: unknown
          p_level: string
          p_message: string
          p_stack_trace?: string
          p_url?: string
          p_user_agent?: string
          p_user_id?: string
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
      validate_invite: {
        Args: { p_invite_id: string }
        Returns: {
          email: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      validate_product_category: {
        Args: { category_value: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "director"
        | "sales_manager"
        | "salesperson"
        | "accountant"
        | "engineer"
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
      app_role: [
        "admin",
        "user",
        "director",
        "sales_manager",
        "salesperson",
        "accountant",
        "engineer",
      ],
    },
  },
} as const
