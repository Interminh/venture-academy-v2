"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ActionState {
  error?: string;
}

export async function createTutorCode(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Enter a code." };

  const { error } = await supabase.from("tutor_signup_codes").insert({ code });
  if (error) {
    return {
      error: error.code === "23505" ? "That code is already in use." : error.message,
    };
  }

  revalidatePath("/dashboard/admin/users");
  return {};
}

export async function toggleTutorCodeActive(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");
  const isActive = formData.get("isActive") === "true";

  const { error } = await supabase
    .from("tutor_signup_codes")
    .update({ is_active: !isActive })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/users");
  return {};
}

// Clears a deactivated code off the main list, same visibility-only
// pattern as dismissing a cancelled claim or a deleted student. Only
// allowed once a code is already deactivated, same precondition as those.
export async function dismissTutorCode(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const id = String(formData.get("id") ?? "");

  const { data, error } = await supabase
    .from("tutor_signup_codes")
    .update({ admin_dismissed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("is_active", false)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "This code can no longer be dismissed." };
  }

  revalidatePath("/dashboard/admin/users");
  return {};
}
