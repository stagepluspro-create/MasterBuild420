export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      activity_feed: {
        Row: {
          id: string
          team_id: string
          user_id: string
          project_id: string | null
          activity_type: string
          description: string
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          project_id?: string | null
          activity_type: string
          description: string
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          project_id?: string | null
          activity_type?: string
          description?: string
          metadata?: Json | null
          created_at?: string | null
        }
      }
      audit_log: {
        Row: {
          id: string
          user_id: string
          action: string
          tool_id: string | null
          meta: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          tool_id?: string | null
          meta?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          tool_id?: string | null
          meta?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string | null
        }
      }
      budget_items: {
        Row: {
          id: string
          project_id: string | null
          user_id: string
          category: string
          item_name: string
          description: string | null
          estimated_cost: number
          actual_cost: number | null
          quantity: number | null
          supplier: string | null
          status: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          user_id: string
          category: string
          item_name: string
          description?: string | null
          estimated_cost?: number
          actual_cost?: number | null
          quantity?: number | null
          supplier?: string | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          user_id?: string
          category?: string
          item_name?: string
          description?: string | null
          estimated_cost?: number
          actual_cost?: number | null
          quantity?: number | null
          supplier?: string | null
          status?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      budget_snapshots: {
        Row: {
          id: string
          project_id: string | null
          user_id: string
          snapshot_name: string
          snapshot_data: Json
          total_estimated: number | null
          total_actual: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id?: string | null
          user_id: string
          snapshot_name: string
          snapshot_data: Json
          total_estimated?: number | null
          total_actual?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string | null
          user_id?: string
          snapshot_name?: string
          snapshot_data?: Json
          total_estimated?: number | null
          total_actual?: number | null
          created_at?: string | null
        }
      }
      dmx_fixtures: {
        Row: {
          id: string
          patch_id: string
          fixture_number: number
          manufacturer: string | null
          model: string | null
          mode: string | null
          universe: number
          address: number
          channel_count: number
          notes: string | null
          position: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          patch_id: string
          fixture_number: number
          manufacturer?: string | null
          model?: string | null
          mode?: string | null
          universe: number
          address: number
          channel_count: number
          notes?: string | null
          position?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          patch_id?: string
          fixture_number?: number
          manufacturer?: string | null
          model?: string | null
          mode?: string | null
          universe?: number
          address?: number
          channel_count?: number
          notes?: string | null
          position?: Json | null
          created_at?: string | null
        }
      }
      dmx_patches: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          project_id: string | null
          team_id: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          project_id?: string | null
          team_id?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          project_id?: string | null
          team_id?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      documents: {
        Row: {
          id: string
          team_id: string
          title: string
          content: string | null
          author_id: string
          folder: string | null
          tags: string[] | null
          is_public: boolean | null
          version: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          team_id: string
          title: string
          content?: string | null
          author_id: string
          folder?: string | null
          tags?: string[] | null
          is_public?: boolean | null
          version?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          title?: string
          content?: string | null
          author_id?: string
          folder?: string | null
          tags?: string[] | null
          is_public?: boolean | null
          version?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      interest_requests: {
        Row: {
          id: string
          user_id: string
          tool_id: string
          notes: string | null
          status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          tool_id: string
          notes?: string | null
          status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          tool_id?: string
          notes?: string | null
          status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          created_at?: string | null
        }
      }
      inventory_items: {
        Row: {
          id: string
          team_id: string | null
          user_id: string
          name: string
          category: string | null
          quantity: number | null
          unit: string | null
          location: string | null
          serial_number: string | null
          purchase_date: string | null
          purchase_price: number | null
          condition: string | null
          notes: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          team_id?: string | null
          user_id: string
          name: string
          category?: string | null
          quantity?: number | null
          unit?: string | null
          location?: string | null
          serial_number?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          condition?: string | null
          notes?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string | null
          user_id?: string
          name?: string
          category?: string | null
          quantity?: number | null
          unit?: string | null
          location?: string | null
          serial_number?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          condition?: string | null
          notes?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      monitor_mixes: {
        Row: {
          id: string
          patch_list_id: string
          mix_number: number
          performer_name: string | null
          mix_type: string | null
          notes: string | null
          channels: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          patch_list_id: string
          mix_number: number
          performer_name?: string | null
          mix_type?: string | null
          notes?: string | null
          channels?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          patch_list_id?: string
          mix_number?: number
          performer_name?: string | null
          mix_type?: string | null
          notes?: string | null
          channels?: Json | null
          created_at?: string | null
        }
      }
      patch_channels: {
        Row: {
          id: string
          patch_list_id: string
          channel_number: number
          input_source: string | null
          output_destination: string | null
          label: string | null
          microphone_type: string | null
          cable_length: number | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          patch_list_id: string
          channel_number: number
          input_source?: string | null
          output_destination?: string | null
          label?: string | null
          microphone_type?: string | null
          cable_length?: number | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          patch_list_id?: string
          channel_number?: number
          input_source?: string | null
          output_destination?: string | null
          label?: string | null
          microphone_type?: string | null
          cable_length?: number | null
          notes?: string | null
          created_at?: string | null
        }
      }
      patch_lists: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          project_id: string | null
          team_id: string | null
          console_type: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          project_id?: string | null
          team_id?: string | null
          console_type?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          project_id?: string | null
          team_id?: string | null
          console_type?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      power_devices: {
        Row: {
          id: string
          plan_id: string
          name: string
          watts: number
          amps: number | null
          quantity: number | null
          circuit_number: number | null
          notes: string | null
          device_type: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          plan_id: string
          name: string
          watts: number
          amps?: number | null
          quantity?: number | null
          circuit_number?: number | null
          notes?: string | null
          device_type?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          plan_id?: string
          name?: string
          watts?: number
          amps?: number | null
          quantity?: number | null
          circuit_number?: number | null
          notes?: string | null
          device_type?: string | null
          created_at?: string | null
        }
      }
      power_plans: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          voltage: number
          max_amps: number
          power_factor: number | null
          safety_margin: number | null
          project_id: string | null
          team_id: string | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          voltage?: number
          max_amps?: number
          power_factor?: number | null
          safety_margin?: number | null
          project_id?: string | null
          team_id?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          voltage?: number
          max_amps?: number
          power_factor?: number | null
          safety_margin?: number | null
          project_id?: string | null
          team_id?: string | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      presets: {
        Row: {
          id: string
          user_id: string
          tool_id: string
          name: string
          payload: Json
          project_id: string | null
          shared_with_team: boolean | null
          shared_by: string | null
          shared_at: string | null
          tags: string[] | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          tool_id: string
          name: string
          payload: Json
          project_id?: string | null
          shared_with_team?: boolean | null
          shared_by?: string | null
          shared_at?: string | null
          tags?: string[] | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          tool_id?: string
          name?: string
          payload?: Json
          project_id?: string | null
          shared_with_team?: boolean | null
          shared_by?: string | null
          shared_at?: string | null
          tags?: string[] | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          settings: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      project_files: {
        Row: {
          id: string
          project_id: string
          filename: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          uploaded_by: string
          description: string | null
          tags: string[] | null
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          filename: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by: string
          description?: string | null
          tags?: string[] | null
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          filename?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string
          description?: string | null
          tags?: string[] | null
          created_at?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_user_id: string
          team_id: string | null
          status: string | null
          start_date: string | null
          end_date: string | null
          tags: string[] | null
          metadata: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_user_id: string
          team_id?: string | null
          status?: string | null
          start_date?: string | null
          end_date?: string | null
          tags?: string[] | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_user_id?: string
          team_id?: string | null
          status?: string | null
          start_date?: string | null
          end_date?: string | null
          tags?: string[] | null
          metadata?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      spl_measurements: {
        Row: {
          id: string
          user_id: string
          venue_id: string | null
          measurement_name: string
          spl_value: number
          frequency_weighting: string | null
          time_weighting: string | null
          location: string | null
          notes: string | null
          ambient_noise: number | null
          max_peak: number | null
          duration_seconds: number | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          venue_id?: string | null
          measurement_name: string
          spl_value: number
          frequency_weighting?: string | null
          time_weighting?: string | null
          location?: string | null
          notes?: string | null
          ambient_noise?: number | null
          max_peak?: number | null
          duration_seconds?: number | null
          metadata?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          venue_id?: string | null
          measurement_name?: string
          spl_value?: number
          frequency_weighting?: string | null
          time_weighting?: string | null
          location?: string | null
          notes?: string | null
          ambient_noise?: number | null
          max_peak?: number | null
          duration_seconds?: number | null
          metadata?: Json | null
          created_at?: string | null
        }
      }
      spl_venues: {
        Row: {
          id: string
          user_id: string
          name: string
          venue_type: string | null
          capacity: number | null
          compliance_limit: number | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          venue_type?: string | null
          capacity?: number | null
          compliance_limit?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          venue_type?: string | null
          capacity?: number | null
          compliance_limit?: number | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: string
          status: string
          seats: number
          trial_start: string | null
          trial_end: string | null
          subscription_start: string | null
          subscription_end: string | null
          paypal_transaction_id: string | null
          paypal_subscription_id: string | null
          auto_renew: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          tier?: string
          status?: string
          seats?: number
          trial_start?: string | null
          trial_end?: string | null
          subscription_start?: string | null
          subscription_end?: string | null
          paypal_transaction_id?: string | null
          paypal_subscription_id?: string | null
          auto_renew?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          tier?: string
          status?: string
          seats?: number
          trial_start?: string | null
          trial_end?: string | null
          subscription_start?: string | null
          subscription_end?: string | null
          paypal_transaction_id?: string | null
          paypal_subscription_id?: string | null
          auto_renew?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string | null
          status: string | null
          priority: string | null
          assigned_to: string | null
          due_date: string | null
          completed_at: string | null
          created_by: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string | null
          status?: string | null
          priority?: string | null
          assigned_to?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_by: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          title?: string
          description?: string | null
          status?: string | null
          priority?: string | null
          assigned_to?: string | null
          due_date?: string | null
          completed_at?: string | null
          created_by?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string | null
          role: string
          invitation_email: string | null
          invitation_token: string | null
          invitation_expires_at: string | null
          invited_by: string | null
          invited_at: string | null
          joined_at: string | null
          last_active: string | null
          status: string | null
          permissions: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          team_id: string
          user_id?: string | null
          role?: string
          invitation_email?: string | null
          invitation_token?: string | null
          invitation_expires_at?: string | null
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string | null
          last_active?: string | null
          status?: string | null
          permissions?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string | null
          role?: string
          invitation_email?: string | null
          invitation_token?: string | null
          invitation_expires_at?: string | null
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string | null
          last_active?: string | null
          status?: string | null
          permissions?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          owner_user_id: string
          max_seats: number
          description: string | null
          logo_url: string | null
          contact_email: string | null
          archived: boolean | null
          settings: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          owner_user_id: string
          max_seats?: number
          description?: string | null
          logo_url?: string | null
          contact_email?: string | null
          archived?: boolean | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          owner_user_id?: string
          max_seats?: number
          description?: string | null
          logo_url?: string | null
          contact_email?: string | null
          archived?: boolean | null
          settings?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
