"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Weekday } from "@/lib/types/database";

export interface ActionState {
  error?: string;
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

  const { data: tutee, error: tuteeError } = await supabase
    .from("tutees")
    .insert({ parent_id: user.id, first_name: firstName, grade })
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

// Resyncs a tutee's subjects and availability to match the submitted form.
// Slots with a live (pending or approved) claim are never removed, even if
// the parent unchecks them. The claim keeps its slot until it's cancelled.
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
  const subjectIds = formData.getAll("subjectId").map(String);
  const submittedSlots = parseSlots(formData);

  const { error: updateError } = await supabase
    .from("tutees")
    .update({ first_name: firstName, grade })
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
    .eq("tutee_id", tuteeId);

  const { data: liveClaims } = await supabase
    .from("claims")
    .select("slot_id")
    .in("status", ["pending", "approved"]);
  const liveSlotIds = new Set((liveClaims ?? []).map((c) => c.slot_id));

  const slotKey = (s: { day: string; start_time: string }) => `${s.day}|${s.start_time}`;
  const submittedKeys = new Set(submittedSlots.map((s) => `${s.day}|${s.startTime}`));

  const toRemoveSlots = (existingSlots ?? []).filter(
    (s) => !submittedKeys.has(slotKey(s)) && !liveSlotIds.has(s.id)
  );
  const toAddSlots = submittedSlots.filter(
    (s) => !(existingSlots ?? []).some((e) => slotKey(e) === `${s.day}|${s.startTime}`)
  );

  if (toRemoveSlots.length > 0) {
    await supabase
      .from("availability_slots")
      .delete()
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
