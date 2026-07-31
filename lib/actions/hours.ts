"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionState {
  error?: string;
}

export async function logHours(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const sessionDate = String(formData.get("sessionDate") ?? "");
  const hours = Number(formData.get("hours"));
  const studentLabel = String(formData.get("studentLabel") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!sessionDate) return { error: "Please pick a date." };
  if (!studentLabel) return { error: "Please say who the session was for." };
  if (Number.isNaN(hours) || hours <= 0 || hours > 24) {
    return { error: "Hours must be a number between 0 and 24." };
  }

  const { error } = await supabase.from("tutor_hours").insert({
    tutor_id: user.id,
    session_date: sessionDate,
    hours,
    student_label: studentLabel,
    description: description || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/tutor/claims");
  return {};
}

export async function deleteHours(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.from("tutor_hours").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/tutor/claims");
  return {};
}
