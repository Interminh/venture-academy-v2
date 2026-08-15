"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toHHMM } from "@/lib/utils/slots";
import type { Weekday } from "@/lib/types/database";

export interface ActionState {
  error?: string;
  success?: string;
}

// Slot checkboxes in the form are named "slot" with value "day|start_time".
// One shared schedule per student, independent of subject.
function parseSlots(formData: FormData): { day: Weekday; startTime: string }[] {
  return formData.getAll("slot").map((raw) => {
    const [day, startTime] = String(raw).split("|");
    return { day: day as Weekday, startTime };
  });
}

export async function createTutee(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const firstName = String(formData.get("firstName") ?? "").trim();
  const grade = Number(formData.get("grade"));
  const notes = String(formData.get("notes") ?? "").trim();
  const maxWeeklySessionsRaw = String(formData.get("maxWeeklySessions") ?? "").trim();
  const maxWeeklySessions = maxWeeklySessionsRaw ? Number(maxWeeklySessionsRaw) : null;
  const subjectIds = formData.getAll("subjectId").map(String);
  const slots = parseSlots(formData);

  if (!firstName || Number.isNaN(grade)) {
    return { error: "Please fill in your student's name and grade." };
  }
  if (subjectIds.length === 0) {
    return { error: "Please select at least one subject." };
  }
  if (slots.length === 0) {
    return { error: "Please select at least one available time slot." };
  }
  if (maxWeeklySessions !== null && (Number.isNaN(maxWeeklySessions) || maxWeeklySessions < 1)) {
    return { error: "Max weekly sessions must be a positive number." };
  }

  const { data: tutee, error: tuteeError } = await supabase
    .from("tutees")
    .insert({
      parent_id: user.id,
      first_name: firstName,
      grade,
      notes: notes || null,
      max_weekly_sessions: maxWeeklySessions,
    })
    .select("id")
    .single();

  if (tuteeError || !tutee) {
    return { error: tuteeError?.message ?? "Could not create student." };
  }

  const { error: subjectsError } = await supabase
    .from("tutee_subjects")
    .insert(subjectIds.map((subjectId) => ({ tutee_id: tutee.id, subject_id: subjectId })));

  if (subjectsError) return { error: subjectsError.message };

  const { error: slotsError } = await supabase.from("availability_slots").insert(
    slots.map((s) => ({
      tutee_id: tutee.id,
      day: s.day,
      start_time: s.startTime,
    }))
  );

  if (slotsError) return { error: slotsError.message };

  revalidatePath("/dashboard/parent");
  redirect("/dashboard/parent");
}

// Soft-deletes a student: parent removing their own, or an admin acting on
// a family's behalf. Any pending or approved claim gets cancelled first, so
// a tutor never ends up quietly holding a booking for a student that no
// longer exists. The tutee row itself is never hard-deleted (same reasoning
// as availability_slots), an admin can still see it and its claim history
// in the ledger, it just drops out of the parent's and tutor's lists.
export async function deleteTutee(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const tuteeId = String(formData.get("tuteeId") ?? "");

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("id")
    .eq("tutee_id", tuteeId)
    .eq("is_active", true);
  const slotIds = (slots ?? []).map((s) => s.id);

  if (slotIds.length > 0) {
    const { data: liveClaims } = await supabase
      .from("claims")
      .select("id")
      .in("slot_id", slotIds)
      .in("status", ["pending", "approved"]);

    if (liveClaims && liveClaims.length > 0) {
      await supabase
        .from("claims")
        .update({ status: "cancelled", cancelled_by: user.id, cancelled_at: new Date().toISOString() })
        .in("id", liveClaims.map((c) => c.id));
    }
  }

  const { data, error } = await supabase
    .from("tutees")
    .update({ is_active: false })
    .eq("id", tuteeId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "This student can no longer be removed." };
  }

  revalidatePath("/dashboard/parent");
  revalidatePath("/dashboard/parent/sessions");
  revalidatePath("/dashboard/tutor");
  revalidatePath("/dashboard/admin/tutees");
  return { success: "Student removed." };
}

// Resyncs a tutee's subjects and availability to match the submitted form.
// Unchecking a slot that has a live (pending or approved) claim now cancels
// that claim instead of silently keeping the slot around. A parent who
// removes an offered time is telling the tutor it's off the table. Slots
// are soft-deleted (is_active = false), never hard-deleted, so a cancelled
// claim's history survives (hard-deleting the slot would cascade-delete it).
export async function updateTutee(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const tuteeId = String(formData.get("tuteeId") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const grade = Number(formData.get("grade"));
  const notes = String(formData.get("notes") ?? "").trim();
  const maxWeeklySessionsRaw = String(formData.get("maxWeeklySessions") ?? "").trim();
  const maxWeeklySessions = maxWeeklySessionsRaw ? Number(maxWeeklySessionsRaw) : null;
  const subjectIds = formData.getAll("subjectId").map(String);
  const submittedSlots = parseSlots(formData);

  if (maxWeeklySessions !== null && (Number.isNaN(maxWeeklySessions) || maxWeeklySessions < 1)) {
    return { error: "Max weekly sessions must be a positive number." };
  }

  const { error: updateError } = await supabase
    .from("tutees")
    .update({
      first_name: firstName,
      grade,
      notes: notes || null,
      max_weekly_sessions: maxWeeklySessions,
    })
    .eq("id", tuteeId);
  if (updateError) return { error: updateError.message };

  const { data: existingSubjects } = await supabase
    .from("tutee_subjects")
    .select("id, subject_id")
    .eq("tutee_id", tuteeId);

  const toRemoveSubjects = (existingSubjects ?? []).filter(
    (s) => !subjectIds.includes(s.subject_id)
  );
  const toAddSubjects = subjectIds.filter(
    (id) => !(existingSubjects ?? []).some((s) => s.subject_id === id)
  );

  if (toRemoveSubjects.length > 0) {
    await supabase
      .from("tutee_subjects")
      .delete()
      .in("id", toRemoveSubjects.map((s) => s.id));
  }
  if (toAddSubjects.length > 0) {
    await supabase
      .from("tutee_subjects")
      .insert(toAddSubjects.map((subjectId) => ({ tutee_id: tuteeId, subject_id: subjectId })));
  }

  const { data: existingSlots } = await supabase
    .from("availability_slots")
    .select("id, day, start_time")
    .eq("tutee_id", tuteeId)
    .eq("is_active", true);

  const { data: liveClaims } = await supabase
    .from("claims")
    .select("id, slot_id")
    .in("status", ["pending", "approved"]);
  const liveClaimIdBySlotId = new Map((liveClaims ?? []).map((c) => [c.slot_id, c.id]));

  const slotKey = (s: { day: string; start_time: string }) => `${s.day}|${toHHMM(s.start_time)}`;
  const submittedKeys = new Set(submittedSlots.map((s) => `${s.day}|${s.startTime}`));

  const toRemoveSlots = (existingSlots ?? []).filter((s) => !submittedKeys.has(slotKey(s)));
  const toAddSlots = submittedSlots.filter(
    (s) => !(existingSlots ?? []).some((e) => slotKey(e) === `${s.day}|${s.startTime}`)
  );

  const claimIdsToCancel = toRemoveSlots
    .map((s) => liveClaimIdBySlotId.get(s.id))
    .filter((id): id is string => Boolean(id));

  if (claimIdsToCancel.length > 0) {
    await supabase
      .from("claims")
      .update({ status: "cancelled", cancelled_by: user.id, cancelled_at: new Date().toISOString() })
      .in("id", claimIdsToCancel);
  }

  if (toRemoveSlots.length > 0) {
    await supabase
      .from("availability_slots")
      .update({ is_active: false })
      .in("id", toRemoveSlots.map((s) => s.id));
  }
  if (toAddSlots.length > 0) {
    await supabase.from("availability_slots").insert(
      toAddSlots.map((s) => ({
        tutee_id: tuteeId,
        day: s.day,
        start_time: s.startTime,
      }))
    );
  }

  revalidatePath("/dashboard/parent");
  redirect("/dashboard/parent");
}
