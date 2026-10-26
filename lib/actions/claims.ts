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

// Claims an open slot. The unique index on claims(slot_id) makes it race-safe.
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

  // Weekly cap counts pending claims too. Check-then-insert, so a rare race can slip through.
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

// Hides a cancelled or rejected claim from the tutor's list, history untouched.
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

// Tutor cancels their own approved claim and the slot reopens.
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

  // Email failures must never undo an approval.
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

// Hides a claim from the admin ledger for every admin, history untouched.
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

// Admin cancels from any status, attributed to the admin.
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
