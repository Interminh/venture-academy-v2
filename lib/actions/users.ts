"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

export interface ActionState {
  error?: string;
  success?: string;
}

// Promotes or demotes an existing account. Admin-only. An admin can't
// change their own role here so a solo admin can't lock themselves out
// by accident.
export async function updateUserRole(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const targetId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "") as UserRole;

  if (!["admin", "tutor", "parent"].includes(role)) {
    return { error: "Invalid role." };
  }
  if (targetId === user.id) {
    return { error: "You can't change your own role here. Ask another admin." };
  }

  const { error } = await supabase.from("profiles").update({ role }).eq("id", targetId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/users");
  return { success: "Role updated." };
}
