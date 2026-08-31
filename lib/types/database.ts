// Hand-written to match the migrations in supabase/migrations until a real
// Supabase project exists. Once connected, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > lib/types/database.ts
// (this file gets overwritten, that's fine)
// The `Relationships: []` entries aren't real foreign key metadata, just
// what @supabase/postgrest-js expects to type-check embedded queries.

export type UserRole = "admin" | "tutor" | "parent";
export type ClaimStatus = "pending" | "approved" | "rejected" | "cancelled";
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri";
export type SlotStatusValue = "open" | "pending" | "approved";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          display_name: string;
          email: string;
          notifications_enabled: boolean;
          unsubscribe_token: string;
          admin_dismissed_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          display_name: string;
          email: string;
          notifications_enabled?: boolean;
          unsubscribe_token?: string;
          admin_dismissed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          role: UserRole;
          display_name: string;
          email: string;
          notifications_enabled: boolean;
          admin_dismissed_at: string | null;
        }>;
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<{
          name: string;
          is_active: boolean;
        }>;
        Relationships: [];
      };
      tutees: {
        Row: {
          id: string;
          parent_id: string;
          first_name: string;
          grade: number;
          notes: string | null;
          max_weekly_sessions: number | null;
          is_active: boolean;
          admin_dismissed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          first_name: string;
          grade: number;
          notes?: string | null;
          max_weekly_sessions?: number | null;
          is_active?: boolean;
          admin_dismissed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          first_name: string;
          grade: number;
          notes: string | null;
          max_weekly_sessions: number | null;
          is_active: boolean;
          admin_dismissed_at: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "tutees_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      tutee_subjects: {
        Row: {
          id: string;
          tutee_id: string;
          subject_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tutee_id: string;
          subject_id: string;
          created_at?: string;
        };
        Update: Partial<{
          tutee_id: string;
          subject_id: string;
        }>;
        Relationships: [
          {
            foreignKeyName: "tutee_subjects_tutee_id_fkey";
            columns: ["tutee_id"];
            isOneToOne: false;
            referencedRelation: "tutees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tutee_subjects_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          }
        ];
      };
      availability_slots: {
        Row: {
          id: string;
          tutee_id: string;
          day: Weekday;
          start_time: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tutee_id: string;
          day: Weekday;
          start_time: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<{
          tutee_id: string;
          day: Weekday;
          start_time: string;
          is_active: boolean;
        }>;
        Relationships: [
          {
            foreignKeyName: "availability_slots_tutee_id_fkey";
            columns: ["tutee_id"];
            isOneToOne: false;
            referencedRelation: "tutees";
            referencedColumns: ["id"];
          }
        ];
      };
      claims: {
        Row: {
          id: string;
          slot_id: string;
          tutor_id: string;
          subject_id: string;
          status: ClaimStatus;
          requested_at: string;
          decided_by: string | null;
          decided_at: string | null;
          cancelled_by: string | null;
          cancelled_at: string | null;
          cancel_reason: string | null;
          tutor_dismissed_at: string | null;
          admin_dismissed_at: string | null;
        };
        Insert: {
          id?: string;
          slot_id: string;
          tutor_id: string;
          subject_id: string;
          status?: ClaimStatus;
          requested_at?: string;
          decided_by?: string | null;
          decided_at?: string | null;
          cancelled_by?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
          tutor_dismissed_at?: string | null;
          admin_dismissed_at?: string | null;
        };
        Update: Partial<{
          status: ClaimStatus;
          decided_by: string | null;
          decided_at: string | null;
          cancelled_by: string | null;
          cancelled_at: string | null;
          cancel_reason: string | null;
          tutor_dismissed_at: string | null;
          admin_dismissed_at: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "claims_slot_id_fkey";
            columns: ["slot_id"];
            isOneToOne: false;
            referencedRelation: "availability_slots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "claims_tutor_id_fkey";
            columns: ["tutor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "claims_subject_id_fkey";
            columns: ["subject_id"];
            isOneToOne: false;
            referencedRelation: "subjects";
            referencedColumns: ["id"];
          }
        ];
      };
      tutor_signup_codes: {
        Row: {
          id: string;
          code: string;
          is_active: boolean;
          admin_dismissed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          is_active?: boolean;
          admin_dismissed_at?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          code: string;
          is_active: boolean;
          admin_dismissed_at: string | null;
        }>;
        Relationships: [];
      };
      tutor_hours: {
        Row: {
          id: string;
          tutor_id: string;
          session_date: string;
          hours: number;
          student_label: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tutor_id: string;
          session_date: string;
          hours: number;
          student_label: string;
          description?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          session_date: string;
          hours: number;
          student_label: string;
          description: string | null;
        }>;
        Relationships: [];
      };
    };
    Views: {
      slot_status: {
        Row: {
          slot_id: string;
          tutee_id: string;
          day: Weekday;
          start_time: string;
          claim_id: string | null;
          tutor_id: string | null;
          claimed_subject_id: string | null;
          status: SlotStatusValue;
        };
        Relationships: [];
      };
      tutor_visible_contacts: {
        Row: {
          tutee_id: string;
          parent_display_name: string;
          parent_email: string;
          tutor_id: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_valid_tutor_code: {
        Args: { input_code: string };
        Returns: boolean;
      };
      is_email_registered: {
        Args: { input_email: string };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      claim_status: ClaimStatus;
      weekday: Weekday;
    };
    CompositeTypes: Record<string, never>;
  };
}
