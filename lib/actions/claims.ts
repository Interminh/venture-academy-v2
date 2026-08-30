"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendSessionBookedNotifications } from "@/lib/email/notifications";
import type { Weekday } from "@/lib/types/database";

export interface ActionState {
  error?: string;
  success?: string;
}

const UNIQUE_VIOLATION = "23505";

// A tutor claims an open slot for one of the student's needed subjects.
// A slot itself isn't tied to any subject, that gets chosen here. The
// partial unique index on claims(slot_id) for pending/approved rows is
// what actually makes this race-safe: if another tutor claimed it a
// moment ago, this insert fails and we show a friendly message instead
// of a stack trace.
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
  const subjectId = String(formData.get("subjectId") ?? "");
  if (!slotId || !subjectId) return { error: "Please choose a subject." };

  const { data: slot } = await supabase
    .from("availability_slots")
    .select("tutee_id")
    .eq("id", slotId)
    .single();
  if (!slot) return { error: "That slot no longer exists." };

  const { data: needsSubject } = await supabase
    .from("tutee_subjects")
    .select("id")
    .eq("tutee_id", slot.tutee_id)
    .eq("subject_id", subjectId)
    .maybeSingle();
  if (!needsSubject) return { error: "This student doesn't need that subject." };

  // A student's weekly cap counts pending claims too, not just approved
  // ones, so a pile of pending requests can't quietly add up to more
  // sessions than the family asked for once a director works through
  // them. This is a check-then-insert, not a database constraint, so two
  // tutors claiming different slots on the same near-full student at the
  // exact same moment could both slip through, same tradeoff the rest of
  // this action already accepts for a club-sized volume of traffic.
  const { data: tutee } = await supabase
    .from("tutees")
    .select("max_weekly_sessions")
    .eq("id", slot.tutee_id)
    .single();

  if (tutee?.max_weekly_sessions != null) {
    const { data: tuteeSlots } = await supabase
      .from("availability_slots")
      .select("id")
      .eq("tutee_id", slot.tutee_id);
    const tuteeSlotIds = (tuteeSlots ?? []).map((s) => s.id);

    const { count: liveCount } = await supabase
      .from("claims")
      .select("id", { count: "exact", head: true })
      .in("slot_id", tuteeSlotIds)
      .in("status", ["pending", "approved"]);

    if ((liveCount ?? 0) >= tutee.max_weekly_sessions) {
      return { error: "This student has already reached their weekly session limit." };
    }
  }

  const { error } = await supabase
    .from("claims")
    .insert({ slot_id: slotId, tutor_id: user.id, subject_id: subjectId, status: "pending" });

  if (error) {
    if (error.code === UNIQUE_VIOLATION) {
      return { error: "Someone just claimed this slot. Try another one." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/tutor/claims");
  return { success: "Claim submitted. A director will review it shortly." };
}

// Clears a cancelled/rejected claim off the tutor's own "My sessions" list.
// This is a visibility flag, not a delete, the claims_update_tutor_dismiss
// RLS policy only allows setting tutor_dismissed_at on the tutor's own
// claim once it's already cancelled or rejected, so nothing about the
// claim's history changes for the admin ledger.
export async function dismissClaim(
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
    .update({ tutor_dismissed_at: new Date().toISOString() })
    .eq("id", claimId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "This claim can no longer be dismissed." };
  }

  revalidatePath("/dashboard/tutor/claims");
  return {};
}

// Tutor self-cancel: only allowed on their own approved claim, enforced by
// the claims_update_tutor_cancel RLS policy. Reopens the slot to open.
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
  return { success: "Booking cancelled. The slot is open again." };
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
  const { data: claim, error } = await supabase
    .from("claims")
    .update({ status: "approved", decided_by: user.id, decided_at: new Date().toISOString() })
    .eq("id", claimId)
    .select(
      "tutor_id, subjects(name), availability_slots(day, start_time, tutees(first_name, parent_id))"
    )
    .single();

  if (error) return { error: error.message };

  // Notification emails are a courtesy, not part of the approval itself,
  // a Resend outage or a missing API key should never undo an approval
  // that already succeeded.
  try {
    const slot = claim?.availability_slots as unknown as {
      day: Weekday;
      start_time: string;
      tutees: { first_name: string; parent_id: string } | null;
    } | null;
    const subject = claim?.subjects as unknown as { name: string } | null;

    if (slot?.tutees) {
      const { data: recipients } = await supabase
        .from("profiles")
        .select("id, display_name, email, notifications_enabled, unsubscribe_token")
        .in("id", [claim.tutor_id, slot.tutees.parent_id]);

      const tutorProfile = recipients?.find((r) => r.id === claim.tutor_id);
      const parentProfile = recipients?.find((r) => r.id === slot.tutees!.parent_id);

      if (tutorProfile && parentProfile) {
        await sendSessionBookedNotifications({
          tutor: {
            displayName: tutorProfile.display_name,
            email: tutorProfile.email,
            notificationsEnabled: tutorProfile.notifications_enabled,
            unsubscribeToken: tutorProfile.unsubscribe_token,
          },
          parent: {
            displayName: parentProfile.display_name,
            email: parentProfile.email,
            notificationsEnabled: parentProfile.notifications_enabled,
            unsubscribeToken: parentProfile.unsubscribe_token,
          },
          studentFirstName: slot.tutees.first_name,
          subjectName: subject?.name ?? "their subject",
          day: slot.day,
          startTime: slot.start_time,
        });
      }
    }
  } catch (notifyError) {
    console.error("Failed to send booking notification emails:", notifyError);
  }

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

// Clears a cancelled/rejected claim off the admin ledger view. Visibility
// only, same as the tutor's dismissClaim: the row and its full history
// stay exactly as they are, this just stops it from rendering in the
// ledger table by default. Shared across every admin account, not scoped
// to whichever director clicked it.
export async function dismissLedgerClaim(
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
    .update({ admin_dismissed_at: new Date().toISOString() })
    .eq("id", claimId)
    .in("status", ["cancelled", "rejected"])
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "This claim can no longer be dismissed." };
  }

  revalidatePath("/dashboard/admin/ledger");
  return {};
}

// Admin force-cancel: same reopen behavior as a tutor self-cancel, but it
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
