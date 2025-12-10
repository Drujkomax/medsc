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
      bot_state: {
        Row: {
          lead: Json
          step: string
          user_id: number
        }
        Insert: {
          lead: Json
          step: string
          user_id: number
        }
        Update: {
          lead?: Json
          step?: string
          user_id?: number
        }
        Relationships: []
      }
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
      client_interaction_logs: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          id: string
          interaction_type: string
          message: string
          subject: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          interaction_type: string
          message: string
          subject?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          interaction_type?: string
          message?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_interaction_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_stock: {
        Row: {
          average_monthly_consumption: number | null
          client_id: string
          created_at: string
          created_by: string | null
          custom_item_description: string | null
          custom_item_name: Json | null
          estimated_depletion_date: string | null
          id: string
          last_refill_date: string | null
          location: string | null
          minimum_stock: number | null
          notes: string | null
          notification_threshold_days: number | null
          notify_low_stock: boolean | null
          product_id: string | null
          quantity: number
          serial_numbers: string[] | null
          unit: string
          updated_at: string
          updated_by: string | null
          warehouse_item_id: string | null
        }
        Insert: {
          average_monthly_consumption?: number | null
          client_id: string
          created_at?: string
          created_by?: string | null
          custom_item_description?: string | null
          custom_item_name?: Json | null
          estimated_depletion_date?: string | null
          id?: string
          last_refill_date?: string | null
          location?: string | null
          minimum_stock?: number | null
          notes?: string | null
          notification_threshold_days?: number | null
          notify_low_stock?: boolean | null
          product_id?: string | null
          quantity?: number
          serial_numbers?: string[] | null
          unit?: string
          updated_at?: string
          updated_by?: string | null
          warehouse_item_id?: string | null
        }
        Update: {
          average_monthly_consumption?: number | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          custom_item_description?: string | null
          custom_item_name?: Json | null
          estimated_depletion_date?: string | null
          id?: string
          last_refill_date?: string | null
          location?: string | null
          minimum_stock?: number | null
          notes?: string | null
          notification_threshold_days?: number | null
          notify_low_stock?: boolean | null
          product_id?: string | null
          quantity?: number
          serial_numbers?: string[] | null
          unit?: string
          updated_at?: string
          updated_by?: string | null
          warehouse_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_stock_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_stock_warehouse_item_id_fkey"
            columns: ["warehouse_item_id"]
            isOneToOne: false
            referencedRelation: "warehouse_items"
            referencedColumns: ["id"]
          },
        ]
      }
      client_stock_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          client_id: string
          client_stock_id: string
          created_at: string
          id: string
          message: string
          resolved: boolean | null
          resolved_at: string | null
          severity: string
          telegram_sent: boolean | null
          telegram_sent_at: string | null
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          client_id: string
          client_stock_id: string
          created_at?: string
          id?: string
          message: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
          telegram_sent?: boolean | null
          telegram_sent_at?: string | null
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          client_id?: string
          client_stock_id?: string
          created_at?: string
          id?: string
          message?: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: string
          telegram_sent?: boolean | null
          telegram_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_stock_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_stock_alerts_client_stock_id_fkey"
            columns: ["client_stock_id"]
            isOneToOne: false
            referencedRelation: "client_stock"
            referencedColumns: ["id"]
          },
        ]
      }
      client_stock_transactions: {
        Row: {
          client_id: string
          client_stock_id: string
          created_at: string
          deal_id: string | null
          document_url: string | null
          id: string
          notes: string | null
          performed_by: string | null
          quantity: number
          quantity_after: number
          quantity_before: number
          reason: string | null
          transaction_type: string
        }
        Insert: {
          client_id: string
          client_stock_id: string
          created_at?: string
          deal_id?: string | null
          document_url?: string | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          quantity: number
          quantity_after: number
          quantity_before: number
          reason?: string | null
          transaction_type: string
        }
        Update: {
          client_id?: string
          client_stock_id?: string
          created_at?: string
          deal_id?: string | null
          document_url?: string | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          quantity?: number
          quantity_after?: number
          quantity_before?: number
          reason?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_stock_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_stock_transactions_client_stock_id_fkey"
            columns: ["client_stock_id"]
            isOneToOne: false
            referencedRelation: "client_stock"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_stock_transactions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          archived: boolean | null
          archived_at: string | null
          archived_by: string | null
          assigned_manager: string | null
          city: string | null
          company: string | null
          contact_person: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          contract_status: string | null
          cooperation_type: string[] | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          inn: string | null
          last_contact: string | null
          legal_name: string | null
          name: string
          notes: string | null
          phone: string | null
          priority: string | null
          telegram_chat_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_manager?: string | null
          city?: string | null
          company?: string | null
          contact_person?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_status?: string | null
          cooperation_type?: string[] | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          last_contact?: string | null
          legal_name?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          priority?: string | null
          telegram_chat_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_manager?: string | null
          city?: string | null
          company?: string | null
          contact_person?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_status?: string | null
          cooperation_type?: string[] | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          inn?: string | null
          last_contact?: string | null
          legal_name?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          priority?: string | null
          telegram_chat_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      clinic_documents: {
        Row: {
          category: string | null
          client_id: string
          created_at: string | null
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          client_id: string
          created_at?: string | null
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_invoices: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          paid_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number
          client_id: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          paid_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          paid_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_shipments: {
        Row: {
          carrier: string | null
          client_id: string
          created_at: string | null
          created_by: string | null
          delivered_date: string | null
          id: string
          items: Json | null
          notes: string | null
          shipment_number: string | null
          shipped_date: string | null
          status: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          carrier?: string | null
          client_id: string
          created_at?: string | null
          created_by?: string | null
          delivered_date?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          shipment_number?: string | null
          shipped_date?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          carrier?: string | null
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          delivered_date?: string | null
          id?: string
          items?: Json | null
          notes?: string | null
          shipment_number?: string | null
          shipped_date?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_shipments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      deal_audit_log: {
        Row: {
          action_type: string
          changed_fields: string[] | null
          created_at: string
          deal_id: string
          id: string
          new_values: Json | null
          old_values: Json | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action_type: string
          changed_fields?: string[] | null
          created_at?: string
          deal_id: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action_type?: string
          changed_fields?: string[] | null
          created_at?: string
          deal_id?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_audit_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_documents: {
        Row: {
          created_at: string | null
          deal_id: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          deal_id?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          deal_id?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
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
          debt_amount: number | null
          id: string
          lead_id: string | null
          notes: string | null
          payment_status: string | null
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
          debt_amount?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          payment_status?: string | null
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
          debt_amount?: number | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          payment_status?: string | null
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
          session_duration?: number | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      employee_custom_permissions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          permission_level: string
          section: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          permission_level: string
          section: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          permission_level?: string
          section?: string
          updated_at?: string | null
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
          client_id: string | null
          closed_at: string | null
          company: string | null
          created_at: string
          email: string | null
          equipment_interest: string | null
          id: string
          lead_created_date: string | null
          lead_quality: string | null
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          qualification_date: string | null
          qualified_by: string | null
          source: string | null
          stage: string
          telegram_id: number | null
          timeline: string | null
          updated_at: string
          value: number | null
          visit_goal: string | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          city?: string | null
          client_id?: string | null
          closed_at?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          equipment_interest?: string | null
          id?: string
          lead_created_date?: string | null
          lead_quality?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          qualification_date?: string | null
          qualified_by?: string | null
          source?: string | null
          stage?: string
          telegram_id?: number | null
          timeline?: string | null
          updated_at?: string
          value?: number | null
          visit_goal?: string | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          budget_range?: string | null
          city?: string | null
          client_id?: string | null
          closed_at?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          equipment_interest?: string | null
          id?: string
          lead_created_date?: string | null
          lead_quality?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          qualification_date?: string | null
          qualified_by?: string | null
          source?: string | null
          stage?: string
          telegram_id?: number | null
          timeline?: string | null
          updated_at?: string
          value?: number | null
          visit_goal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturers: {
        Row: {
          country_code: string
          created_at: string
          created_by: string | null
          id: string
          legal_name: string | null
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          country_code: string
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          id: string
          payload: Json | null
          planned_at: string
          sent_at: string | null
          status: string
          template_id: string
          user_id: string
        }
        Insert: {
          id?: string
          payload?: Json | null
          planned_at?: string
          sent_at?: string | null
          status?: string
          template_id: string
          user_id: string
        }
        Update: {
          id?: string
          payload?: Json | null
          planned_at?: string
          sent_at?: string | null
          status?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          audience: string
          body_md: string
          code: string
          created_at: string | null
          id: string
          throttle_seconds: number
          title: string
        }
        Insert: {
          audience?: string
          body_md: string
          code: string
          created_at?: string | null
          id?: string
          throttle_seconds?: number
          title: string
        }
        Update: {
          audience?: string
          body_md?: string
          code?: string
          created_at?: string | null
          id?: string
          throttle_seconds?: number
          title?: string
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
          icon_url: string | null
          id: string
          images: Json | null
          in_stock: boolean
          manufacturer_id: string | null
          manufacturer_name: string | null
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
          icon_url?: string | null
          id?: string
          images?: Json | null
          in_stock?: boolean
          manufacturer_id?: string | null
          manufacturer_name?: string | null
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
          icon_url?: string | null
          id?: string
          images?: Json | null
          in_stock?: boolean
          manufacturer_id?: string | null
          manufacturer_name?: string | null
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
        Relationships: [
          {
            foreignKeyName: "products_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
        ]
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
          assignee_ids: string[] | null
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
          assignee_ids?: string[] | null
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
          assignee_ids?: string[] | null
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
      telegram_links: {
        Row: {
          created_at: string | null
          id: string
          linked_at: string | null
          login_token: string | null
          telegram_id: number
          telegram_username: string | null
          user_id: string | null
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          linked_at?: string | null
          login_token?: string | null
          telegram_id: number
          telegram_username?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          linked_at?: string | null
          login_token?: string | null
          telegram_id?: number
          telegram_username?: string | null
          user_id?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      temporary_employees: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      users: {
        Row: {
          created_at: string | null
          goal: string | null
          id: string
          name: string | null
          phone: string | null
        }
        Insert: {
          created_at?: string | null
          goal?: string | null
          id: string
          name?: string | null
          phone?: string | null
        }
        Update: {
          created_at?: string | null
          goal?: string | null
          id?: string
          name?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      warehouse_activity_logs: {
        Row: {
          action_type: string
          changes: Json | null
          created_at: string
          id: string
          item_name: Json
          user_email: string | null
          user_id: string
          user_name: string | null
          warehouse_item_id: string | null
        }
        Insert: {
          action_type: string
          changes?: Json | null
          created_at?: string
          id?: string
          item_name: Json
          user_email?: string | null
          user_id: string
          user_name?: string | null
          warehouse_item_id?: string | null
        }
        Update: {
          action_type?: string
          changes?: Json | null
          created_at?: string
          id?: string
          item_name?: Json
          user_email?: string | null
          user_id?: string
          user_name?: string | null
          warehouse_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_activity_logs_warehouse_item_id_fkey"
            columns: ["warehouse_item_id"]
            isOneToOne: false
            referencedRelation: "warehouse_items"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_items: {
        Row: {
          archived: boolean | null
          archived_at: string | null
          archived_by: string | null
          condition: string
          created_at: string
          created_by: string | null
          description: Json | null
          id: string
          images: Json | null
          location: string | null
          minimum_stock: number | null
          name: Json
          notes: string | null
          notify_low_stock: boolean | null
          product_id: string | null
          purchase_price: number | null
          quantity: number
          selling_price: number | null
          status: string
          unit: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          condition?: string
          created_at?: string
          created_by?: string | null
          description?: Json | null
          id?: string
          images?: Json | null
          location?: string | null
          minimum_stock?: number | null
          name?: Json
          notes?: string | null
          notify_low_stock?: boolean | null
          product_id?: string | null
          purchase_price?: number | null
          quantity?: number
          selling_price?: number | null
          status?: string
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived?: boolean | null
          archived_at?: string | null
          archived_by?: string | null
          condition?: string
          created_at?: string
          created_by?: string | null
          description?: Json | null
          id?: string
          images?: Json | null
          location?: string | null
          minimum_stock?: number | null
          name?: Json
          notes?: string | null
          notify_low_stock?: boolean | null
          product_id?: string | null
          purchase_price?: number | null
          quantity?: number
          selling_price?: number | null
          status?: string
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      apply_invite_permissions: {
        Args: {
          p_expires_at: string
          p_full_access: string[]
          p_invite_id: string
          p_is_temporary: boolean
          p_user_id: string
          p_view_only: string[]
        }
        Returns: undefined
      }
      archive_client: {
        Args: { p_client_id: string; p_user_id: string }
        Returns: undefined
      }
      archive_lead: {
        Args: { lead_id: string; user_id: string }
        Returns: undefined
      }
      archive_product: {
        Args: { product_id: string; user_id: string }
        Returns: undefined
      }
      archive_warehouse_item: {
        Args: { item_id: string; user_id: string }
        Returns: undefined
      }
      assign_role_from_invite: {
        Args: { p_invite_id: string; p_user_id: string }
        Returns: Json
      }
      cleanup_old_logs: {
        Args: { days_to_keep?: number }
        Returns: {
          deleted_count: number
        }[]
      }
      confirm_user_registration: { Args: { user_id: string }; Returns: Json }
      create_first_director: { Args: { director_email: string }; Returns: Json }
      create_user_invite: {
        Args: {
          invite_email: string
          invite_role: Database["public"]["Enums"]["app_role"]
        }
        Returns: Json
      }
      get_clients_with_low_stock: {
        Args: never
        Returns: {
          client_id: string
          client_name: string
          critical_count: number
          low_stock_count: number
        }[]
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
        Args: never
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          id: string
        }[]
      }
      get_employees_with_roles: {
        Args: never
        Returns: {
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
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
      get_low_stock_items: {
        Args: never
        Returns: {
          id: string
          location: string
          minimum_stock: number
          name: Json
          product_id: string
          quantity: number
        }[]
      }
      get_pending_invites: {
        Args: never
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
      has_custom_permission: {
        Args: { _required_level?: string; _section: string; _user_id: string }
        Returns: boolean
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
      is_temporary_employee_active: {
        Args: { _user_id: string }
        Returns: boolean
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
      unarchive_product: { Args: { product_id: string }; Returns: undefined }
      unarchive_warehouse_item: {
        Args: { item_id: string }
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
        | "observer"
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
        "observer",
      ],
    },
  },
} as const
