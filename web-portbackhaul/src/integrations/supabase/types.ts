/* eslint-disable */
// AUTO-GENERATED — DO NOT EDIT
// Run migrations to regenerate.

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
      admin_permissions: {
        Row: {
          admin_user_id: string
          created_at: string
          id: string
          permission: string
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          id?: string
          permission: string
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          id?: string
          permission?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_permissions_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_declines: {
        Row: {
          assignment_id: string
          created_at: string
          driver_id: string
          reason: string | null
        }
        Insert: {
          assignment_id: string
          created_at?: string
          driver_id: string
          reason?: string | null
        }
        Update: {
          assignment_id?: string
          created_at?: string
          driver_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_declines_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "shipment_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_declines_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      association_dues: {
        Row: {
          amount_minor_units: number
          association_id: string
          billing_period: string
          created_at: string
          created_by: string
          currency: string
          description: string | null
          due_date: string | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount_minor_units: number
          association_id: string
          billing_period?: string
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount_minor_units?: number
          association_id?: string
          billing_period?: string
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "association_dues_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_dues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      association_members: {
        Row: {
          association_id: string
          created_at: string
          id: string
          joined_at: string
          membership_number: string
          membership_status: string
          user_id: string
        }
        Insert: {
          association_id: string
          created_at?: string
          id?: string
          joined_at?: string
          membership_number: string
          membership_status?: string
          user_id: string
        }
        Update: {
          association_id?: string
          created_at?: string
          id?: string
          joined_at?: string
          membership_number?: string
          membership_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "association_members_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      association_payments: {
        Row: {
          amount_minor_units: number
          association_id: string
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          member_due_id: string | null
          member_id: string
          metadata: Json
          order_id: string | null
          payment_method: string
          payment_purpose: string
          payment_reference: string
          payment_status: string
          provider_reference: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          amount_minor_units: number
          association_id: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          member_due_id?: string | null
          member_id: string
          metadata?: Json
          order_id?: string | null
          payment_method?: string
          payment_purpose: string
          payment_reference?: string
          payment_status?: string
          provider_reference?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          amount_minor_units?: number
          association_id?: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          member_due_id?: string | null
          member_id?: string
          metadata?: Json
          order_id?: string | null
          payment_method?: string
          payment_purpose?: string
          payment_reference?: string
          payment_status?: string
          provider_reference?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "association_payments_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_payments_member_due_id_fkey"
            columns: ["member_due_id"]
            isOneToOne: false
            referencedRelation: "member_dues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "costume_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      association_roles: {
        Row: {
          association_id: string
          granted_at: string
          granted_by: string | null
          id: string
          revoked_at: string | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          association_id: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          role: string
          status?: string
          user_id: string
        }
        Update: {
          association_id?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          revoked_at?: string | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "association_roles_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "association_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      associations: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          logo_path: string | null
          name: string
          region: string
          status: string
          town: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          logo_path?: string | null
          name: string
          region: string
          status?: string
          town: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          logo_path?: string | null
          name?: string
          region?: string
          status?: string
          town?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "associations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json
          session_info: string | null
          trip_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          session_info?: string | null
          trip_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json
          session_info?: string | null
          trip_id?: string | null
        }
        Relationships: []
      }
      cargo_parties: {
        Row: {
          contact: string | null
          created_at: string
          id: string
          name: string | null
          party_role: string
          profile_id: string | null
          shipment_id: string
        }
        Insert: {
          contact?: string | null
          created_at?: string
          id?: string
          name?: string | null
          party_role: string
          profile_id?: string | null
          shipment_id: string
        }
        Update: {
          contact?: string | null
          created_at?: string
          id?: string
          name?: string | null
          party_role?: string
          profile_id?: string | null
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cargo_parties_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargo_parties_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "cargo_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      cargo_shipments: {
        Row: {
          cargo_ref: string
          cargo_type: string
          clearing_agent_id: string | null
          consignee_contact: string | null
          consignee_name: string | null
          contact_person: string | null
          contact_phone: string | null
          container_number: string | null
          created_at: string
          description: string
          destination_city: string | null
          destination_country: string | null
          destination_location_id: string | null
          expected_pickup_date: string | null
          id: string
          is_demo: boolean
          owner_id: string
          pickup_location_id: string | null
          pickup_location_text: string | null
          quantity: number | null
          quantity_unit: string | null
          special_instructions: string | null
          status: string
          transport_fee_ghs: number | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          cargo_ref?: string
          cargo_type?: string
          clearing_agent_id?: string | null
          consignee_contact?: string | null
          consignee_name?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          container_number?: string | null
          created_at?: string
          description: string
          destination_city?: string | null
          destination_country?: string | null
          destination_location_id?: string | null
          expected_pickup_date?: string | null
          id?: string
          is_demo?: boolean
          owner_id: string
          pickup_location_id?: string | null
          pickup_location_text?: string | null
          quantity?: number | null
          quantity_unit?: string | null
          special_instructions?: string | null
          status?: string
          transport_fee_ghs?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          cargo_ref?: string
          cargo_type?: string
          clearing_agent_id?: string | null
          consignee_contact?: string | null
          consignee_name?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          container_number?: string | null
          created_at?: string
          description?: string
          destination_city?: string | null
          destination_country?: string | null
          destination_location_id?: string | null
          expected_pickup_date?: string | null
          id?: string
          is_demo?: boolean
          owner_id?: string
          pickup_location_id?: string | null
          pickup_location_text?: string | null
          quantity?: number | null
          quantity_unit?: string | null
          special_instructions?: string | null
          status?: string
          transport_fee_ghs?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cargo_shipments_clearing_agent_id_fkey"
            columns: ["clearing_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargo_shipments_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargo_shipments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cargo_shipments_pickup_location_id_fkey"
            columns: ["pickup_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      clearing_agents: {
        Row: {
          company_name: string
          created_at: string
          id: string
          is_accepting_work: boolean
          licence_no: string | null
          office_location: string | null
          profile_id: string
          updated_at: string
        }
        Insert: {
          company_name: string
          created_at?: string
          id?: string
          is_accepting_work?: boolean
          licence_no?: string | null
          office_location?: string | null
          profile_id: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          created_at?: string
          id?: string
          is_accepting_work?: boolean
          licence_no?: string | null
          office_location?: string | null
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clearing_agents_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      costume_orders: {
        Row: {
          amount_paid_minor_units: number
          association_id: string
          created_at: string
          currency: string
          fitting_required: boolean
          id: string
          member_id: string
          notes: string | null
          order_number: string
          order_status: string
          requested_collection_date: string | null
          total_amount_minor_units: number
          updated_at: string
        }
        Insert: {
          amount_paid_minor_units?: number
          association_id: string
          created_at?: string
          currency?: string
          fitting_required?: boolean
          id?: string
          member_id: string
          notes?: string | null
          order_number?: string
          order_status?: string
          requested_collection_date?: string | null
          total_amount_minor_units?: number
          updated_at?: string
        }
        Update: {
          amount_paid_minor_units?: number
          association_id?: string
          created_at?: string
          currency?: string
          fitting_required?: boolean
          id?: string
          member_id?: string
          notes?: string | null
          order_number?: string
          order_status?: string
          requested_collection_date?: string | null
          total_amount_minor_units?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "costume_orders_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costume_orders_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      costumes: {
        Row: {
          association_id: string
          available_sizes: string[]
          costume_type: string
          created_at: string
          created_by: string
          currency: string
          description: string | null
          id: string
          image_paths: Json
          inventory_quantity: number
          made_to_order: boolean
          name: string
          price_minor_units: number
          status: string
          updated_at: string
        }
        Insert: {
          association_id: string
          available_sizes?: string[]
          costume_type?: string
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          id?: string
          image_paths?: Json
          inventory_quantity?: number
          made_to_order?: boolean
          name: string
          price_minor_units: number
          status?: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          available_sizes?: string[]
          costume_type?: string
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          id?: string
          image_paths?: Json
          inventory_quantity?: number
          made_to_order?: boolean
          name?: string
          price_minor_units?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "costumes_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "costumes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customs_integrations: {
        Row: {
          authority: string | null
          connection_status: string
          created_at: string
          display_name: string
          id: string
          last_checked_at: string | null
          notes: string | null
          provider_key: string
          updated_at: string
        }
        Insert: {
          authority?: string | null
          connection_status?: string
          created_at?: string
          display_name: string
          id?: string
          last_checked_at?: string | null
          notes?: string | null
          provider_key: string
          updated_at?: string
        }
        Update: {
          authority?: string | null
          connection_status?: string
          created_at?: string
          display_name?: string
          id?: string
          last_checked_at?: string | null
          notes?: string | null
          provider_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_confirmations: {
        Row: {
          confirmed_at: string
          confirmed_by: string | null
          created_at: string
          evidence_paths: string[]
          id: string
          notes: string | null
          otp_code: string | null
          otp_verified: boolean
          receiver_name: string
          signature_data: string | null
          trip_id: string
        }
        Insert: {
          confirmed_at?: string
          confirmed_by?: string | null
          created_at?: string
          evidence_paths?: string[]
          id?: string
          notes?: string | null
          otp_code?: string | null
          otp_verified?: boolean
          receiver_name: string
          signature_data?: string | null
          trip_id: string
        }
        Update: {
          confirmed_at?: string
          confirmed_by?: string | null
          created_at?: string
          evidence_paths?: string[]
          id?: string
          notes?: string | null
          otp_code?: string | null
          otp_verified?: boolean
          receiver_name?: string
          signature_data?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_confirmations_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_confirmations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trip_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          payment_id: string | null
          raised_by: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          shipment_id: string | null
          status: string
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          id?: string
          payment_id?: string | null
          raised_by: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          shipment_id?: string | null
          status?: string
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          payment_id?: string | null
          raised_by?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          shipment_id?: string | null
          status?: string
          trip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "cargo_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_documents: {
        Row: {
          created_at: string
          document_number: string | null
          document_status: string
          document_type: string
          driver_id: string
          expiry_date: string | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          storage_path: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_status?: string
          document_type: string
          driver_id: string
          expiry_date?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_path: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_status?: string
          document_type?: string
          driver_id?: string
          expiry_date?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          assigned_truck_id: string | null
          completed_trips: number
          created_at: string
          current_lat: number | null
          current_lng: number | null
          id: string
          is_available: boolean
          is_demo: boolean
          licence_expiry: string | null
          licence_no: string | null
          location_updated_at: string | null
          profile_id: string
          rating: number | null
          truck_owner_id: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          assigned_truck_id?: string | null
          completed_trips?: number
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          id?: string
          is_available?: boolean
          is_demo?: boolean
          licence_expiry?: string | null
          licence_no?: string | null
          location_updated_at?: string | null
          profile_id: string
          rating?: number | null
          truck_owner_id?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          assigned_truck_id?: string | null
          completed_trips?: number
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          id?: string
          is_available?: boolean
          is_demo?: boolean
          licence_expiry?: string | null
          licence_no?: string | null
          location_updated_at?: string | null
          profile_id?: string
          rating?: number | null
          truck_owner_id?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_assigned_truck_id_fkey"
            columns: ["assigned_truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_truck_owner_id_fkey"
            columns: ["truck_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      elite_circle_points: {
        Row: {
          created_at: string
          description: string
          id: string
          points: number
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          points: number
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          points?: number
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "elite_circle_points_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fitting_appointments: {
        Row: {
          appointment_date: string
          appointment_status: string
          association_id: string
          created_at: string
          created_by: string
          id: string
          member_id: string
          notes: string | null
          order_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_status?: string
          association_id: string
          created_at?: string
          created_by: string
          id?: string
          member_id: string
          notes?: string | null
          order_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_status?: string
          association_id?: string
          created_at?: string
          created_by?: string
          id?: string
          member_id?: string
          notes?: string | null
          order_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fitting_appointments_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fitting_appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fitting_appointments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fitting_appointments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "costume_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_events: {
        Row: {
          created_at: string
          id: string
          integration_id: string | null
          operation: string
          request_payload: Json
          requested_by: string | null
          response_payload: Json
          response_status: string
          shipment_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          integration_id?: string | null
          operation: string
          request_payload?: Json
          requested_by?: string | null
          response_payload?: Json
          response_status?: string
          shipment_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          integration_id?: string | null
          operation?: string
          request_payload?: Json
          requested_by?: string | null
          response_payload?: Json
          response_status?: string
          shipment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "customs_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "cargo_shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      loading_verifications: {
        Row: {
          action: string
          created_at: string
          id: string
          location_text: string | null
          notes: string | null
          operator_id: string
          trip_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          location_text?: string | null
          notes?: string | null
          operator_id: string
          trip_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          location_text?: string | null
          notes?: string | null
          operator_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loading_verifications_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loading_verifications_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          city: string | null
          country: string
          created_at: string
          id: string
          is_active: boolean
          kind: string
          latitude: number | null
          longitude: number | null
          name: string
        }
        Insert: {
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          latitude?: number | null
          longitude?: number | null
          name: string
        }
        Update: {
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
        }
        Relationships: []
      }
      member_dues: {
        Row: {
          amount_due_minor_units: number
          amount_paid_minor_units: number
          association_due_id: string
          association_id: string
          created_at: string
          id: string
          member_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_due_minor_units: number
          amount_paid_minor_units?: number
          association_due_id: string
          association_id: string
          created_at?: string
          id?: string
          member_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_due_minor_units?: number
          amount_paid_minor_units?: number
          association_due_id?: string
          association_id?: string
          created_at?: string
          id?: string
          member_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_dues_association_due_id_fkey"
            columns: ["association_due_id"]
            isOneToOne: false
            referencedRelation: "association_dues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_dues_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_dues_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_measurements: {
        Row: {
          additional_measurements: Json
          association_id: string
          chest: number | null
          created_at: string
          height: number | null
          hips: number | null
          id: string
          inseam: number | null
          measurement_unit: string
          recommendation: string | null
          recommendation_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          shoulder_width: number | null
          sleeve_length: number | null
          updated_at: string
          user_id: string
          waist: number | null
        }
        Insert: {
          additional_measurements?: Json
          association_id: string
          chest?: number | null
          created_at?: string
          height?: number | null
          hips?: number | null
          id?: string
          inseam?: number | null
          measurement_unit?: string
          recommendation?: string | null
          recommendation_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shoulder_width?: number | null
          sleeve_length?: number | null
          updated_at?: string
          user_id: string
          waist?: number | null
        }
        Update: {
          additional_measurements?: Json
          association_id?: string
          chest?: number | null
          created_at?: string
          height?: number | null
          hips?: number | null
          id?: string
          inseam?: number | null
          measurement_unit?: string
          recommendation?: string | null
          recommendation_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shoulder_width?: number | null
          sleeve_length?: number | null
          updated_at?: string
          user_id?: string
          waist?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "member_measurements_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_measurements_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_measurements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_benefits: {
        Row: {
          active: boolean
          benefit_name: string
          description: string
          id: string
          membership_level: string
          role: string | null
          sort_order: number
        }
        Insert: {
          active?: boolean
          benefit_name: string
          description: string
          id?: string
          membership_level: string
          role?: string | null
          sort_order?: number
        }
        Update: {
          active?: boolean
          benefit_name?: string
          description?: string
          id?: string
          membership_level?: string
          role?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          event_type: string
          id: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          event_type: string
          id?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          event_type?: string
          id?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          costume_id: string
          created_at: string
          id: string
          line_total_minor_units: number
          measurement_id: string | null
          order_id: string
          quantity: number
          selected_size: string | null
          unit_price_minor_units: number
        }
        Insert: {
          costume_id: string
          created_at?: string
          id?: string
          line_total_minor_units: number
          measurement_id?: string | null
          order_id: string
          quantity: number
          selected_size?: string | null
          unit_price_minor_units: number
        }
        Update: {
          costume_id?: string
          created_at?: string
          id?: string
          line_total_minor_units?: number
          measurement_id?: string | null
          order_id?: string
          quantity?: number
          selected_size?: string | null
          unit_price_minor_units?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_costume_id_fkey"
            columns: ["costume_id"]
            isOneToOne: false
            referencedRelation: "costumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_measurement_id_fkey"
            columns: ["measurement_id"]
            isOneToOne: false
            referencedRelation: "member_measurements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "costume_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      owner_applications: {
        Row: {
          applicant_details: Json
          applicant_user_id: string
          association_id: string | null
          created_at: string
          id: string
          proposed_association_name: string
          review_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          verification_document_paths: Json
        }
        Insert: {
          applicant_details?: Json
          applicant_user_id: string
          association_id?: string | null
          created_at?: string
          id?: string
          proposed_association_name: string
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          verification_document_paths?: Json
        }
        Update: {
          applicant_details?: Json
          applicant_user_id?: string
          association_id?: string | null
          created_at?: string
          id?: string
          proposed_association_name?: string
          review_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          verification_document_paths?: Json
        }
        Relationships: [
          {
            foreignKeyName: "owner_applications_applicant_user_id_fkey"
            columns: ["applicant_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_applications_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "owner_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          event_type: string
          id: string
          payload: Json
          payment_id: string | null
          processed_at: string
          provider: string
          provider_event_id: string
        }
        Insert: {
          event_type: string
          id?: string
          payload?: Json
          payment_id?: string | null
          processed_at?: string
          provider?: string
          provider_event_id: string
        }
        Update: {
          event_type?: string
          id?: string
          payload?: Json
          payment_id?: string | null
          processed_at?: string
          provider?: string
          provider_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_events_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_recipients: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          momo_provider: string
          phone: string
          recipient_code: string | null
          updated_at: string
          user_id: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          momo_provider: string
          phone: string
          recipient_code?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          momo_provider?: string
          phone?: string
          recipient_code?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          new_status: string
          note: string | null
          old_status: string | null
          source: string
          transaction_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
          source?: string
          transaction_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
          source?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_status_history_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount_pesewas: number
          created_at: string
          currency: string
          description: string | null
          email: string
          failure_reason: string | null
          full_name: string
          gateway_response: string | null
          id: string
          metadata: Json
          momo_provider: string
          paid_at: string | null
          payer_id: string
          payout_status: string
          phone: string
          provider_status: string | null
          provider_transaction_id: string | null
          purpose: string
          recipient_user_id: string | null
          reference: string
          refunded_at: string | null
          request_key: string
          shipment_id: string | null
          status: string
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          amount_pesewas: number
          created_at?: string
          currency?: string
          description?: string | null
          email: string
          failure_reason?: string | null
          full_name: string
          gateway_response?: string | null
          id?: string
          metadata?: Json
          momo_provider: string
          paid_at?: string | null
          payer_id: string
          payout_status?: string
          phone: string
          provider_status?: string | null
          provider_transaction_id?: string | null
          purpose?: string
          recipient_user_id?: string | null
          reference: string
          refunded_at?: string | null
          request_key: string
          shipment_id?: string | null
          status?: string
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_pesewas?: number
          created_at?: string
          currency?: string
          description?: string | null
          email?: string
          failure_reason?: string | null
          full_name?: string
          gateway_response?: string | null
          id?: string
          metadata?: Json
          momo_provider?: string
          paid_at?: string | null
          payer_id?: string
          payout_status?: string
          phone?: string
          provider_status?: string | null
          provider_transaction_id?: string | null
          purpose?: string
          recipient_user_id?: string | null
          reference?: string
          refunded_at?: string | null
          request_key?: string
          shipment_id?: string | null
          status?: string
          trip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "cargo_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_webhook_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          processed_at: string
          provider: string
          provider_event_id: string
          reference: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string
          provider?: string
          provider_event_id: string
          reference?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string
          provider?: string
          provider_event_id?: string
          reference?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_ghs: number
          authorized_at: string | null
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          is_demo: boolean
          metadata: Json
          paid_at: string | null
          payer_id: string | null
          provider: string
          provider_reference: string | null
          released_at: string | null
          shipment_id: string | null
          status: string
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          amount_ghs: number
          authorized_at?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          is_demo?: boolean
          metadata?: Json
          paid_at?: string | null
          payer_id?: string | null
          provider?: string
          provider_reference?: string | null
          released_at?: string | null
          shipment_id?: string | null
          status?: string
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_ghs?: number
          authorized_at?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          is_demo?: boolean
          metadata?: Json
          paid_at?: string | null
          payer_id?: string | null
          provider?: string
          provider_reference?: string | null
          released_at?: string | null
          shipment_id?: string | null
          status?: string
          trip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "cargo_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_records: {
        Row: {
          amount_pesewas: number
          attempts: number
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          processed_at: string | null
          provider_reference: string | null
          provider_transfer_code: string | null
          recipient_code_snapshot: string | null
          recipient_name: string | null
          recipient_network: string | null
          recipient_phone: string | null
          recipient_record_id: string | null
          recipient_user_id: string
          status: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          amount_pesewas: number
          attempts?: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          processed_at?: string | null
          provider_reference?: string | null
          provider_transfer_code?: string | null
          recipient_code_snapshot?: string | null
          recipient_name?: string | null
          recipient_network?: string | null
          recipient_phone?: string | null
          recipient_record_id?: string | null
          recipient_user_id: string
          status?: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          amount_pesewas?: number
          attempts?: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          processed_at?: string | null
          provider_reference?: string | null
          provider_transfer_code?: string | null
          recipient_code_snapshot?: string | null
          recipient_name?: string | null
          recipient_network?: string | null
          recipient_phone?: string | null
          recipient_record_id?: string | null
          recipient_user_id?: string
          status?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_records_recipient_record_id_fkey"
            columns: ["recipient_record_id"]
            isOneToOne: false
            referencedRelation: "payment_recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_records_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_records_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount_ghs: number
          created_at: string
          failure_reason: string | null
          id: string
          is_demo: boolean
          payment_id: string | null
          processed_at: string | null
          provider_reference: string | null
          recipient_id: string
          requested_at: string | null
          status: string
          trip_id: string | null
          updated_at: string
        }
        Insert: {
          amount_ghs: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          is_demo?: boolean
          payment_id?: string | null
          processed_at?: string | null
          provider_reference?: string | null
          recipient_id: string
          requested_at?: string | null
          status?: string
          trip_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_ghs?: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          is_demo?: boolean
          payment_id?: string | null
          processed_at?: string | null
          provider_reference?: string | null
          recipient_id?: string
          requested_at?: string | null
          status?: string
          trip_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_commissions: {
        Row: {
          commission_pesewas: number
          created_at: string
          id: string
          net_amount_pesewas: number
          rate_bp: number
          transaction_id: string
          updated_at: string
        }
        Insert: {
          commission_pesewas: number
          created_at?: string
          id?: string
          net_amount_pesewas: number
          rate_bp?: number
          transaction_id: string
          updated_at?: string
        }
        Update: {
          commission_pesewas?: number
          created_at?: string
          id?: string
          net_amount_pesewas?: number
          rate_bp?: number
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_commissions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: true
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_fees: {
        Row: {
          commission_percent: number
          created_at: string
          driver_earnings_ghs: number
          fee_amount_ghs: number
          id: string
          payment_id: string | null
          trip_id: string | null
        }
        Insert: {
          commission_percent: number
          created_at?: string
          driver_earnings_ghs: number
          fee_amount_ghs: number
          id?: string
          payment_id?: string | null
          trip_id?: string | null
        }
        Update: {
          commission_percent?: number
          created_at?: string
          driver_earnings_ghs?: number
          fee_amount_ghs?: number
          id?: string
          payment_id?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_fees_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_fees_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          block_reason: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_demo: boolean
          phone: string | null
          rejection_reason: string | null
          role: string
          status_changed_at: string | null
          status_changed_by: string | null
          suspension_reason: string | null
          updated_at: string
          verification_reviewed_at: string | null
          verification_reviewed_by: string | null
          verification_status: string
          verification_submitted_at: string | null
        }
        Insert: {
          account_status?: string
          block_reason?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_demo?: boolean
          phone?: string | null
          rejection_reason?: string | null
          role?: string
          status_changed_at?: string | null
          status_changed_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          verification_reviewed_at?: string | null
          verification_reviewed_by?: string | null
          verification_status?: string
          verification_submitted_at?: string | null
        }
        Update: {
          account_status?: string
          block_reason?: string | null
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_demo?: boolean
          phone?: string | null
          rejection_reason?: string | null
          role?: string
          status_changed_at?: string | null
          status_changed_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          verification_reviewed_at?: string | null
          verification_reviewed_by?: string | null
          verification_status?: string
          verification_submitted_at?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string | null
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string | null
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          issued_by: string | null
          last_scanned_at: string | null
          revoked_at: string | null
          scan_count: number
          token: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          issued_by?: string | null
          last_scanned_at?: string | null
          revoked_at?: string | null
          scan_count?: number
          token: string
          trip_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          issued_by?: string | null
          last_scanned_at?: string | null
          revoked_at?: string | null
          scan_count?: number
          token?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_tokens_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          points_awarded: number
          referred_user_id: string
          referrer_id: string
          status: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          points_awarded?: number
          referred_user_id: string
          referrer_id: string
          status?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          points_awarded?: number
          referred_user_id?: string
          referrer_id?: string
          status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          event_type: string
          id: string
          points_change: number
          reference_id: string | null
          user_id: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          event_type: string
          id?: string
          points_change: number
          reference_id?: string | null
          user_id: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          event_type?: string
          id?: string
          points_change?: number
          reference_id?: string | null
          user_id?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reputation_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reputation_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reputation_settings: {
        Row: {
          active: boolean
          id: string
          membership_level: string
          minimum_account_age_days: number
          minimum_completed_trips: number
          minimum_score: number
          require_verification: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          id?: string
          membership_level: string
          minimum_account_age_days: number
          minimum_completed_trips: number
          minimum_score: number
          require_verification?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          id?: string
          membership_level?: string
          minimum_account_age_days?: number
          minimum_completed_trips?: number
          minimum_score?: number
          require_verification?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reputation_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_catalogue: {
        Row: {
          active: boolean
          cost_points: number
          created_at: string
          description: string
          id: string
          min_membership_level: string
          reward_type: string
          role_scope: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          cost_points: number
          created_at?: string
          description: string
          id?: string
          min_membership_level?: string
          reward_type: string
          role_scope?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          cost_points?: number
          created_at?: string
          description?: string
          id?: string
          min_membership_level?: string
          reward_type?: string
          role_scope?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_catalogue_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_redemptions: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          id: string
          points_spent: number
          reference_id: string
          reward_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          id?: string
          points_spent: number
          reference_id: string
          reward_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          id?: string
          points_spent?: number
          reference_id?: string
          reward_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "reward_catalogue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          key: string
          label: string
          requires_verification: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          label: string
          requires_verification?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          label?: string
          requires_verification?: boolean
        }
        Relationships: []
      }
      shipment_assignments: {
        Row: {
          created_at: string
          decline_reason: string | null
          driver_id: string | null
          id: string
          offered_fee_ghs: number | null
          pickup_at: string | null
          requested_by: string
          required_capacity_tons: number
          requirements_notes: string | null
          responded_at: string | null
          route_destination: string | null
          route_origin: string | null
          shipment_id: string
          status: string
          truck_id: string | null
          truck_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decline_reason?: string | null
          driver_id?: string | null
          id?: string
          offered_fee_ghs?: number | null
          pickup_at?: string | null
          requested_by: string
          required_capacity_tons: number
          requirements_notes?: string | null
          responded_at?: string | null
          route_destination?: string | null
          route_origin?: string | null
          shipment_id: string
          status?: string
          truck_id?: string | null
          truck_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decline_reason?: string | null
          driver_id?: string | null
          id?: string
          offered_fee_ghs?: number | null
          pickup_at?: string | null
          requested_by?: string
          required_capacity_tons?: number
          requirements_notes?: string | null
          responded_at?: string | null
          route_destination?: string | null
          route_origin?: string | null
          shipment_id?: string
          status?: string
          truck_id?: string | null
          truck_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_assignments_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "cargo_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_assignments_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      size_charts: {
        Row: {
          association_id: string
          costume_id: string
          created_at: string
          created_by: string
          id: string
          measurement_rules: Json
          measurement_units: string
          size_label: string
          updated_at: string
        }
        Insert: {
          association_id: string
          costume_id: string
          created_at?: string
          created_by: string
          id?: string
          measurement_rules?: Json
          measurement_units?: string
          size_label: string
          updated_at?: string
        }
        Update: {
          association_id?: string
          costume_id?: string
          created_at?: string
          created_by?: string
          id?: string
          measurement_rules?: Json
          measurement_units?: string
          size_label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "size_charts_association_id_fkey"
            columns: ["association_id"]
            isOneToOne: false
            referencedRelation: "associations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "size_charts_costume_id_fkey"
            columns: ["costume_id"]
            isOneToOne: false
            referencedRelation: "costumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "size_charts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supported_routes: {
        Row: {
          base_rate_ghs: number | null
          created_at: string
          destination_id: string
          distance_km: number | null
          id: string
          is_active: boolean
          origin_id: string
        }
        Insert: {
          base_rate_ghs?: number | null
          created_at?: string
          destination_id: string
          distance_km?: number | null
          id?: string
          is_active?: boolean
          origin_id: string
        }
        Update: {
          base_rate_ghs?: number | null
          created_at?: string
          destination_id?: string
          distance_km?: number | null
          id?: string
          is_active?: boolean
          origin_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supported_routes_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supported_routes_origin_id_fkey"
            columns: ["origin_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_assignments: {
        Row: {
          assigned_at: string
          assignment_id: string | null
          cargo_owner_id: string
          clearing_agent_id: string | null
          completed_at: string | null
          created_at: string
          destination_lat: number | null
          destination_lng: number | null
          destination_text: string | null
          driver_id: string
          id: string
          is_demo: boolean
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_location_text: string | null
          shipment_id: string
          started_at: string | null
          status: string
          transport_fee_ghs: number | null
          trip_ref: string
          truck_id: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          assignment_id?: string | null
          cargo_owner_id: string
          clearing_agent_id?: string | null
          completed_at?: string | null
          created_at?: string
          destination_lat?: number | null
          destination_lng?: number | null
          destination_text?: string | null
          driver_id: string
          id?: string
          is_demo?: boolean
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location_text?: string | null
          shipment_id: string
          started_at?: string | null
          status?: string
          transport_fee_ghs?: number | null
          trip_ref?: string
          truck_id: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          assignment_id?: string | null
          cargo_owner_id?: string
          clearing_agent_id?: string | null
          completed_at?: string | null
          created_at?: string
          destination_lat?: number | null
          destination_lng?: number | null
          destination_text?: string | null
          driver_id?: string
          id?: string
          is_demo?: boolean
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location_text?: string | null
          shipment_id?: string
          started_at?: string | null
          status?: string
          transport_fee_ghs?: number | null
          trip_ref?: string
          truck_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_assignments_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "shipment_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_assignments_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "cargo_shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_assignments_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_locations: {
        Row: {
          accuracy_m: number | null
          driver_id: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          speed_kph: number | null
          trip_id: string
        }
        Insert: {
          accuracy_m?: number | null
          driver_id: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
          speed_kph?: number | null
          trip_id: string
        }
        Update: {
          accuracy_m?: number | null
          driver_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          speed_kph?: number | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          note: string | null
          previous_status: string | null
          trip_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          note?: string | null
          previous_status?: string | null
          trip_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          note?: string | null
          previous_status?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_status_history_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trip_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      truck_documents: {
        Row: {
          created_at: string
          document_number: string | null
          document_status: string
          document_type: string
          expiry_date: string | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          storage_path: string
          truck_id: string
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_status?: string
          document_type: string
          expiry_date?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_path: string
          truck_id: string
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_status?: string
          document_type?: string
          expiry_date?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_path?: string
          truck_id?: string
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "truck_documents_truck_id_fkey"
            columns: ["truck_id"]
            isOneToOne: false
            referencedRelation: "trucks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "truck_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trucks: {
        Row: {
          capacity_tons: number
          created_at: string
          current_lat: number | null
          current_lng: number | null
          current_location_id: string | null
          id: string
          is_available: boolean
          is_demo: boolean
          location_updated_at: string | null
          make_model: string | null
          owner_id: string
          registration_no: string
          trailer_info: string | null
          truck_type: string
          updated_at: string
          verification_status: string
          year: number | null
        }
        Insert: {
          capacity_tons: number
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          current_location_id?: string | null
          id?: string
          is_available?: boolean
          is_demo?: boolean
          location_updated_at?: string | null
          make_model?: string | null
          owner_id: string
          registration_no: string
          trailer_info?: string | null
          truck_type?: string
          updated_at?: string
          verification_status?: string
          year?: number | null
        }
        Update: {
          capacity_tons?: number
          created_at?: string
          current_lat?: number | null
          current_lng?: number | null
          current_location_id?: string | null
          id?: string
          is_available?: boolean
          is_demo?: boolean
          location_updated_at?: string | null
          make_model?: string | null
          owner_id?: string
          registration_no?: string
          trailer_info?: string | null
          truck_type?: string
          updated_at?: string
          verification_status?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trucks_current_location_id_fkey"
            columns: ["current_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trucks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_appeals: {
        Row: {
          appeal_reason: string
          created_at: string
          decided_at: string | null
          decision: string | null
          decision_notes: string | null
          evidence_url: string | null
          id: string
          reviewed_by: string | null
          status: string
          user_id: string
          violation_id: string
        }
        Insert: {
          appeal_reason: string
          created_at?: string
          decided_at?: string | null
          decision?: string | null
          decision_notes?: string | null
          evidence_url?: string | null
          id?: string
          reviewed_by?: string | null
          status?: string
          user_id: string
          violation_id: string
        }
        Update: {
          appeal_reason?: string
          created_at?: string
          decided_at?: string | null
          decision?: string | null
          decision_notes?: string | null
          evidence_url?: string | null
          id?: string
          reviewed_by?: string | null
          status?: string
          user_id?: string
          violation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_appeals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_appeals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_appeals_violation_id_fkey"
            columns: ["violation_id"]
            isOneToOne: true
            referencedRelation: "user_violations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_payment_methods: {
        Row: {
          created_at: string
          failure_reason: string | null
          full_name: string | null
          id: string
          momo_network: string | null
          momo_phone: string | null
          paystack_customer_code: string | null
          paystack_transaction_reference: string | null
          updated_at: string
          user_id: string
          verification_status: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          failure_reason?: string | null
          full_name?: string | null
          id?: string
          momo_network?: string | null
          momo_phone?: string | null
          paystack_customer_code?: string | null
          paystack_transaction_reference?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          failure_reason?: string | null
          full_name?: string | null
          id?: string
          momo_network?: string | null
          momo_phone?: string | null
          paystack_customer_code?: string | null
          paystack_transaction_reference?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reputation: {
        Row: {
          account_standing: string
          cancelled_trips: number
          completed_trips: number
          customer_satisfaction: number
          id: string
          loyalty_points: number
          membership_level: string
          on_time_deliveries: number
          payment_compliance: number
          referral_code: string
          referred_by: string | null
          trust_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          account_standing?: string
          cancelled_trips?: number
          completed_trips?: number
          customer_satisfaction?: number
          id?: string
          loyalty_points?: number
          membership_level?: string
          on_time_deliveries?: number
          payment_compliance?: number
          referral_code: string
          referred_by?: string | null
          trust_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          account_standing?: string
          cancelled_trips?: number
          completed_trips?: number
          customer_satisfaction?: number
          id?: string
          loyalty_points?: number
          membership_level?: string
          on_time_deliveries?: number
          payment_compliance?: number
          referral_code?: string
          referred_by?: string | null
          trust_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_reputation_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reputation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          previous_status: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          previous_status?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          previous_status?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_status_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_verification_documents: {
        Row: {
          created_at: string
          document_number: string | null
          document_status: string
          document_type: string
          expiry_date: string | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          storage_path: string
          submitted_at: string | null
          updated_at: string
          user_id: string
          verification_request_id: string | null
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          document_status?: string
          document_type: string
          expiry_date?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_path: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
          verification_request_id?: string | null
        }
        Update: {
          created_at?: string
          document_number?: string | null
          document_status?: string
          document_type?: string
          expiry_date?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          storage_path?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
          verification_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_verification_documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_verification_documents_verification_request_id_fkey"
            columns: ["verification_request_id"]
            isOneToOne: false
            referencedRelation: "user_verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_verification_requests: {
        Row: {
          created_at: string
          id: string
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role: string
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          role?: string
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_violations: {
        Row: {
          created_at: string
          decided_at: string | null
          decision: string | null
          decision_notes: string | null
          description: string
          evidence_url: string | null
          id: string
          reviewed_by: string | null
          severity: string
          status: string
          updated_at: string
          user_id: string
          violation_type: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decision?: string | null
          decision_notes?: string | null
          description: string
          evidence_url?: string | null
          id?: string
          reviewed_by?: string | null
          severity: string
          status?: string
          updated_at?: string
          user_id: string
          violation_type: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decision?: string | null
          decision_notes?: string | null
          description?: string
          evidence_url?: string | null
          id?: string
          reviewed_by?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_violations_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_violations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string | null
          admin_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json
          new_status: string | null
          previous_status: string | null
          reason: string | null
          user_agent: string | null
          vendor_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role?: string | null
          admin_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          new_status?: string | null
          previous_status?: string | null
          reason?: string | null
          user_agent?: string | null
          vendor_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string | null
          admin_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          new_status?: string | null
          previous_status?: string | null
          reason?: string | null
          user_agent?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_audit_logs_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_orders: {
        Row: {
          amount_pesewas: number
          created_at: string
          currency: string
          customer_id: string
          id: string
          items: Json
          order_ref: string
          order_status: string
          payment_status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount_pesewas: number
          created_at?: string
          currency?: string
          customer_id: string
          id?: string
          items?: Json
          order_ref?: string
          order_status?: string
          payment_status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount_pesewas?: number
          created_at?: string
          currency?: string
          customer_id?: string
          id?: string
          items?: Json
          order_ref?: string
          order_status?: string
          payment_status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payment_webhook_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          provider: string
          provider_event_id: string
          reference: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          provider?: string
          provider_event_id: string
          reference?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          provider?: string
          provider_event_id?: string
          reference?: string | null
        }
        Relationships: []
      }
      vendor_products: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          price_pesewas: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          price_pesewas: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          price_pesewas?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_transactions: {
        Row: {
          amount_pesewas: number
          created_at: string
          currency: string
          customer_id: string | null
          failure_reason: string | null
          gateway_response: string | null
          id: string
          metadata: Json
          order_id: string | null
          paid_at: string | null
          payment_provider: string
          payment_status: string
          provider_transaction_id: string | null
          reference: string
          refunded_at: string | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount_pesewas: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          failure_reason?: string | null
          gateway_response?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          paid_at?: string | null
          payment_provider?: string
          payment_status?: string
          provider_transaction_id?: string | null
          reference: string
          refunded_at?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount_pesewas?: number
          created_at?: string
          currency?: string
          customer_id?: string | null
          failure_reason?: string | null
          gateway_response?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          paid_at?: string | null
          payment_provider?: string
          payment_status?: string
          provider_transaction_id?: string | null
          reference?: string
          refunded_at?: string | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "vendor_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_transactions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          business_address: string
          business_category: string
          business_description: string
          business_name: string
          business_photos: Json
          cover_photo_url: string | null
          created_at: string
          document_urls: Json
          email: string
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          operating_hours: Json
          owner_full_name: string
          phone: string
          reactivated_at: string | null
          reactivated_by: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          status: string
          submitted_at: string
          suspended_at: string | null
          suspended_by: string | null
          suspension_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_address: string
          business_category: string
          business_description: string
          business_name: string
          business_photos?: Json
          cover_photo_url?: string | null
          created_at?: string
          document_urls?: Json
          email: string
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          operating_hours?: Json
          owner_full_name: string
          phone: string
          reactivated_at?: string | null
          reactivated_by?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_address?: string
          business_category?: string
          business_description?: string
          business_name?: string
          business_photos?: Json
          cover_photo_url?: string | null
          created_at?: string
          document_urls?: Json
          email?: string
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          operating_hours?: Json
          owner_full_name?: string
          phone?: string
          reactivated_at?: string | null
          reactivated_by?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          submitted_at?: string
          suspended_at?: string | null
          suspended_by?: string | null
          suspension_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_reactivated_by_fkey"
            columns: ["reactivated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requirements: {
        Row: {
          created_at: string
          document_type: string
          id: string
          is_required: boolean
          label: string
          requires_expiry: boolean
          requires_number: boolean
          role: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          document_type: string
          id?: string
          is_required?: boolean
          label: string
          requires_expiry?: boolean
          requires_number?: boolean
          role: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          document_type?: string
          id?: string
          is_required?: boolean
          label?: string
          requires_expiry?: boolean
          requires_number?: boolean
          role?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      trust_profiles_public: {
        Row: {
          account_standing: string | null
          cancellation_rate: number | null
          completed_trips: number | null
          customer_satisfaction: number | null
          full_name: string | null
          is_verified: boolean | null
          loyalty_points: number | null
          membership_level: string | null
          on_time_rate: number | null
          payment_compliance: number | null
          role: string | null
          trip_completion_rate: number | null
          trust_score: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reputation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_cargo_assignment: {
        Args: { p_shipment_id: string }
        Returns: {
          cargo_ref: string
          cargo_type: string
          clearing_agent_id: string | null
          consignee_contact: string | null
          consignee_name: string | null
          contact_person: string | null
          contact_phone: string | null
          container_number: string | null
          created_at: string
          description: string
          destination_city: string | null
          destination_country: string | null
          destination_location_id: string | null
          expected_pickup_date: string | null
          id: string
          is_demo: boolean
          owner_id: string
          pickup_location_id: string | null
          pickup_location_text: string | null
          quantity: number | null
          quantity_unit: string | null
          special_instructions: string | null
          status: string
          transport_fee_ghs: number | null
          updated_at: string
          weight_kg: number | null
        }
        SetofOptions: {
          from: "*"
          to: "cargo_shipments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      accept_open_request: {
        Args: { p_assignment_id: string }
        Returns: {
          assigned_at: string
          assignment_id: string | null
          cargo_owner_id: string
          clearing_agent_id: string | null
          completed_at: string | null
          created_at: string
          destination_lat: number | null
          destination_lng: number | null
          destination_text: string | null
          driver_id: string
          id: string
          is_demo: boolean
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_location_text: string | null
          shipment_id: string
          started_at: string | null
          status: string
          transport_fee_ghs: number | null
          trip_ref: string
          truck_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "trip_assignments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_list_users: {
        Args: {
          p_limit?: number
          p_role?: string
          p_search?: string
          p_status?: string
        }
        Returns: {
          account_status: string
          block_reason: string
          company_name: string
          created_at: string
          document_count: number
          email: string
          full_name: string
          id: string
          phone: string
          rejection_reason: string
          role: string
          suspension_reason: string
          verification_status: string
        }[]
      }
      admin_overview: { Args: never; Returns: Json }
      admin_resolve_dispute: {
        Args: { p_dispute_id: string; p_notes: string; p_status: string }
        Returns: {
          category: string
          created_at: string
          description: string
          id: string
          payment_id: string | null
          raised_by: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          shipment_id: string | null
          status: string
          trip_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "disputes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_review_document: {
        Args: { p_document_id: string; p_reason?: string; p_status: string }
        Returns: {
          created_at: string
          document_number: string | null
          document_status: string
          document_type: string
          expiry_date: string | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          storage_path: string
          submitted_at: string | null
          updated_at: string
          user_id: string
          verification_request_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "user_verification_documents"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_account_status: {
        Args: { p_action: string; p_reason?: string; p_user_id: string }
        Returns: {
          account_status: string
          block_reason: string | null
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_demo: boolean
          phone: string | null
          rejection_reason: string | null
          role: string
          status_changed_at: string | null
          status_changed_by: string | null
          suspension_reason: string | null
          updated_at: string
          verification_reviewed_at: string | null
          verification_reviewed_by: string | null
          verification_status: string
          verification_submitted_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_update_setting: {
        Args: { p_key: string; p_value: Json }
        Returns: {
          description: string | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        SetofOptions: {
          from: "*"
          to: "platform_settings"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_reputation_event: {
        Args: {
          p_actor?: string
          p_description: string
          p_event_type: string
          p_points: number
          p_reference_id: string
          p_user_id: string
          p_verified?: boolean
        }
        Returns: boolean
      }
      assert_approved_role: { Args: { p_role: string }; Returns: string }
      award_loyalty_points: {
        Args: {
          p_description: string
          p_points: number
          p_reference_id: string
          p_txn_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      can_view_vendor_documents: { Args: never; Returns: boolean }
      can_view_vendors: { Args: never; Returns: boolean }
      confirm_delivery: {
        Args: {
          p_evidence?: string[]
          p_notes?: string
          p_otp: string
          p_receiver_name: string
          p_signature?: string
          p_trip_id: string
        }
        Returns: {
          assigned_at: string
          assignment_id: string | null
          cargo_owner_id: string
          clearing_agent_id: string | null
          completed_at: string | null
          created_at: string
          destination_lat: number | null
          destination_lng: number | null
          destination_text: string | null
          driver_id: string
          id: string
          is_demo: boolean
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_location_text: string | null
          shipment_id: string
          started_at: string | null
          status: string
          transport_fee_ghs: number | null
          trip_ref: string
          truck_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "trip_assignments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_category_shipment: {
        Args: {
          p_agent_id: string
          p_cargo_type: string
          p_destination: string
          p_origin_text: string
          p_weight_kg: number
        }
        Returns: string
      }
      current_account_status: { Args: never; Returns: string }
      current_role_key: { Args: never; Returns: string }
      current_vendor_id: { Args: never; Returns: string }
      customs_integration_call: {
        Args: { p_operation: string; p_payload?: Json; p_shipment_id?: string }
        Returns: Json
      }
      decline_open_request: {
        Args: { p_assignment_id: string; p_reason?: string }
        Returns: undefined
      }
      driver_advance_trip: {
        Args: { p_action: string; p_note?: string; p_trip_id: string }
        Returns: {
          assigned_at: string
          assignment_id: string | null
          cargo_owner_id: string
          clearing_agent_id: string | null
          completed_at: string | null
          created_at: string
          destination_lat: number | null
          destination_lng: number | null
          destination_text: string | null
          driver_id: string
          id: string
          is_demo: boolean
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_location_text: string | null
          shipment_id: string
          started_at: string | null
          status: string
          transport_fee_ghs: number | null
          trip_ref: string
          truck_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "trip_assignments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_admin_permission: { Args: { p_permission: string }; Returns: boolean }
      has_association_role: {
        Args: { p_association_id: string; p_roles: string[] }
        Returns: boolean
      }
      is_active_vendor: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_approved: { Args: never; Returns: boolean }
      is_assigned_agent: { Args: { p_shipment_id: string }; Returns: boolean }
      is_association_member: {
        Args: { p_association_id: string }
        Returns: boolean
      }
      is_cargo_party: { Args: { p_shipment_id: string }; Returns: boolean }
      issue_delivery_otp: { Args: { p_trip_id: string }; Returns: string }
      loading_action: {
        Args: {
          p_action: string
          p_location?: string
          p_notes?: string
          p_trip_id: string
        }
        Returns: {
          assigned_at: string
          assignment_id: string | null
          cargo_owner_id: string
          clearing_agent_id: string | null
          completed_at: string | null
          created_at: string
          destination_lat: number | null
          destination_lng: number | null
          destination_text: string | null
          driver_id: string
          id: string
          is_demo: boolean
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_location_text: string | null
          shipment_id: string
          started_at: string | null
          status: string
          transport_fee_ghs: number | null
          trip_ref: string
          truck_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "trip_assignments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      match_trucks: {
        Args: {
          p_capacity: number
          p_lat?: number
          p_limit?: number
          p_lng?: number
          p_truck_type: string
        }
        Returns: {
          capacity_tons: number
          distance_km: number
          driver_available: boolean
          driver_id: string
          driver_name: string
          driver_verification: string
          is_available: boolean
          priority_tier: string
          registration_no: string
          truck_id: string
          truck_type: string
          verification_status: string
        }[]
      }
      mc_apply_verified_payment: {
        Args: {
          p_new_status: string
          p_payment_id: string
          p_provider_reference: string
        }
        Returns: undefined
      }
      mc_is_platform_admin: { Args: never; Returns: boolean }
      notify_user: {
        Args: {
          p_body: string
          p_data?: Json
          p_event: string
          p_title: string
          p_user_id: string
        }
        Returns: undefined
      }
      open_requests_for_driver: {
        Args: never
        Returns: {
          cargo_description: string
          cargo_ref: string
          created_at: string
          id: string
          offered_fee_ghs: number
          pickup_at: string
          required_capacity_tons: number
          requirements_notes: string
          route_destination: string
          route_origin: string
          shipment_id: string
          truck_type: string
          weight_kg: number
        }[]
      }
      owns_or_handles_shipment: {
        Args: { p_shipment_id: string }
        Returns: boolean
      }
      owns_shipment: { Args: { p_shipment_id: string }; Returns: boolean }
      push_trip_status: {
        Args: { p_new: string; p_note: string; p_trip_id: string }
        Returns: undefined
      }
      recalc_membership: { Args: { p_user_id: string }; Returns: string }
      recalc_trust_stats: { Args: { p_user_id: string }; Returns: undefined }
      record_trip_location:
        | {
            Args: {
              p_accuracy?: number
              p_heading?: number
              p_lat: number
              p_lng: number
              p_speed?: number
              p_trip_id: string
            }
            Returns: boolean
          }
        | {
            Args: {
              p_accuracy?: number
              p_heading?: number
              p_lat: number
              p_lng: number
              p_speed?: number
              p_trip_id: string
            }
            Returns: boolean
          }
      request_truck: {
        Args: {
          p_capacity: number
          p_destination: string
          p_fee?: number
          p_notes?: string
          p_origin: string
          p_pickup_at: string
          p_shipment_id: string
          p_truck_id?: string
          p_truck_type: string
        }
        Returns: {
          created_at: string
          decline_reason: string | null
          driver_id: string | null
          id: string
          offered_fee_ghs: number | null
          pickup_at: string | null
          requested_by: string
          required_capacity_tons: number
          requirements_notes: string | null
          responded_at: string | null
          route_destination: string | null
          route_origin: string | null
          shipment_id: string
          status: string
          truck_id: string | null
          truck_type: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "shipment_assignments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      respond_to_assignment: {
        Args: { p_accept: boolean; p_assignment_id: string; p_reason?: string }
        Returns: {
          assigned_at: string
          assignment_id: string | null
          cargo_owner_id: string
          clearing_agent_id: string | null
          completed_at: string | null
          created_at: string
          destination_lat: number | null
          destination_lng: number | null
          destination_text: string | null
          driver_id: string
          id: string
          is_demo: boolean
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_location_text: string | null
          shipment_id: string
          started_at: string | null
          status: string
          transport_fee_ghs: number | null
          trip_ref: string
          truck_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "trip_assignments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_privileged_context: { Args: never; Returns: undefined }
      submit_shipment: {
        Args: { p_agent_id?: string; p_shipment_id: string }
        Returns: {
          cargo_ref: string
          cargo_type: string
          clearing_agent_id: string | null
          consignee_contact: string | null
          consignee_name: string | null
          contact_person: string | null
          contact_phone: string | null
          container_number: string | null
          created_at: string
          description: string
          destination_city: string | null
          destination_country: string | null
          destination_location_id: string | null
          expected_pickup_date: string | null
          id: string
          is_demo: boolean
          owner_id: string
          pickup_location_id: string | null
          pickup_location_text: string | null
          quantity: number | null
          quantity_unit: string | null
          special_instructions: string | null
          status: string
          transport_fee_ghs: number | null
          updated_at: string
          weight_kg: number | null
        }
        SetofOptions: {
          from: "*"
          to: "cargo_shipments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      submit_verification: {
        Args: { p_notes?: string }
        Returns: {
          created_at: string
          id: string
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          role: string
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_verification_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_shipment_operational_status: {
        Args: { p_shipment_id: string; p_status: string }
        Returns: {
          cargo_ref: string
          cargo_type: string
          clearing_agent_id: string | null
          consignee_contact: string | null
          consignee_name: string | null
          contact_person: string | null
          contact_phone: string | null
          container_number: string | null
          created_at: string
          description: string
          destination_city: string | null
          destination_country: string | null
          destination_location_id: string | null
          expected_pickup_date: string | null
          id: string
          is_demo: boolean
          owner_id: string
          pickup_location_id: string | null
          pickup_location_text: string | null
          quantity: number | null
          quantity_unit: string | null
          special_instructions: string | null
          status: string
          transport_fee_ghs: number | null
          updated_at: string
          weight_kg: number | null
        }
        SetofOptions: {
          from: "*"
          to: "cargo_shipments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      verify_trip_qr: { Args: { p_token: string }; Returns: Json }
      write_audit: {
        Args: {
          p_action: string
          p_entity_id: string
          p_entity_type: string
          p_metadata?: Json
          p_trip_id?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
