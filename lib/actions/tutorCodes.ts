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
