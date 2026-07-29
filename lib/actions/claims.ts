"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionState {
  error?: string;
  success?: string;
}

const UNIQUE_VIOLATION = "23505";

// A tutor claims an open slot. The partial unique index on
// claims(slot_id) WHERE status IN ('pending','approved') is what actually
// makes this race-safe — if another tutor claimed it a moment ago, this
// insert fails and we surface a friendly message instead of a stack trace.
export async function submitClaim(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const slotId = String(formData.get("slotId") ?? "");
  if (!slotId) return { error: "Missing slot." };

  const { error } = await supabase
    .from("claims")
    .insert({ slot_id: slotId, tutor_id: user.id, status: "pending" });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: "Someone just claimed this slot — try another one." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/tutor/claims");
  return { success: "Claim submitted — a director will review it shortly." };
}

// Tutor self-cancel: only allowed on their own approved claim (enforced by
// the claims_update_tutor_cancel RLS policy), reopening the slot to Open.
export async function cancelOwnClaim(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const claimId = String(formData.get("claimId") ?? "");

  const { data, error } = await supabase
    .from("claims")
    .update({ status: "cancelled", cancelled_by: user.id, cancelled_at: new Date().toISOString() })
    .eq("id", claimId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "This claim can no longer be cancelled." };
  }

  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/tutor/claims");
  return { success: "Booking cancelled — the slot is open again." };
}

// --- Admin actions ---

export async function approveClaim(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const claimId = String(formData.get("claimId") ?? "");
  const { error } = await supabase
    .from("claims")
    .update({ status: "approved", decided_by: user.id, decided_at: new Date().toISOString() })
    .eq("id", claimId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/ledger");
  return { success: "Claim approved." };
}

export async function rejectClaim(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const claimId = String(formData.get("claimId") ?? "");
  const { error } = await supabase
    .from("claims")
    .update({ status: "rejected", decided_by: user.id, decided_at: new Date().toISOString() })
    .eq("id", claimId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/ledger");
  return { success: "Claim rejected." };
}

// Admin force-cancel: same reopen behavior as a tutor self-cancel, but
// works from any status and is attributed to the admin, not the tutor.
export async function forceCancelClaim(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const claimId = String(formData.get("claimId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  const { error } = await supabase
    .from("claims")
    .update({
      status: "cancelled",
      cancelled_by: user.id,
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason,
    })
    .eq("id", claimId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/ledger");
  return { success: "Booking force-cancelled." };
}
