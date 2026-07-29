"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionState {
  error?: string;
}

export async function createSubject(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Subject name is required." };

  const { error } = await supabase.from("subjects").insert({ name });
  if (error) {
    return {
      error: error.code === "23505" ? "That subject already exists." : error.message,
    };
  }

  revalidatePath("/dashboard/admin/subjects");
  return {};
}

export async function toggleSubjectActive(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";

  const { error } = await supabase
    .from("subjects")
    .update({ is_active: !isActive })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/subjects");
  return {};
}

export async function renameSubject(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Subject name is required." };

  const { error } = await supabase.from("subjects").update({ name }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/subjects");
  return {};
}
