// Hand-written to match supabase/migrations/0001_init.sql until a real
// Supabase project exists. Once connected, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > lib/types/database.ts
// and this file (including this comment) will be overwritten — that's expected.

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
          created_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          display_name: string;
          email: string;
          created_at?: string;
        };
        Update: Partial<{
          role: UserRole;
          display_name: string;
          email: string;
        }>;
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
      };
      tutees: {
        Row: {
          id: string;
          parent_id: string;
          first_name: string;
          grade: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          first_name: string;
          grade: number;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          first_name: string;
          grade: number;
          notes: string | null;
        }>;
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
      };
      availability_slots: {
        Row: {
          id: string;
          tutee_id: string;
          subject_id: string;
          day: Weekday;
          start_time: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tutee_id: string;
          subject_id: string;
          day: Weekday;
          start_time: string;
          created_at?: string;
        };
        Update: Partial<{
          tutee_id: string;
          subject_id: string;
          day: Weekday;
          start_time: string;
        }>;
      };
      claims: {
        Row: {
          id: string;
          slot_id: string;
          tutor_id: string;
          status: ClaimStatus;
          requested_at: string;
          decided_by: string | null;
          decided_at: string | null;
          cancelled_by: string | null;
          cancelled_at: string | null;
          cancel_reason: string | null;
        };
        Insert: {
          id?: string;
          slot_id: string;
          tutor_id: string;
          status?: ClaimStatus;
          requested_at?: string;
          decided_by?: string | null;
          decided_at?: string | null;
          cancelled_by?: string | null;
          cancelled_at?: string | null;
          cancel_reason?: string | null;
        };
        Update: Partial<{
          status: ClaimStatus;
          decided_by: string | null;
          decided_at: string | null;
          cancelled_by: string | null;
          cancelled_at: string | null;
          cancel_reason: string | null;
        }>;
      };
    };
    Views: {
      slot_status: {
        Row: {
          slot_id: string;
          tutee_id: string;
          subject_id: string;
          day: Weekday;
          start_time: string;
          claim_id: string | null;
          tutor_id: string | null;
          status: SlotStatusValue;
        };
      };
      tutor_visible_contacts: {
        Row: {
          tutee_id: string;
          parent_display_name: string;
          parent_email: string;
          tutor_id: string;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      claim_status: ClaimStatus;
      weekday: Weekday;
    };
  };
}
