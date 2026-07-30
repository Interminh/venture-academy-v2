"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

export interface ActionState {
  error?: string;
  success?: string;
}

// Promotes/demotes an existing account. Admin-only, and an admin can't
// change their own role here — prevents a solo admin from accidentally
// locking themselves out by fat-fingering their own row.
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
    return { error: "You can't change your own role here — ask another admin." };
  }

  const { error } = await supabase.from("profiles").update({ role }).eq("id", targetId);
  if (error) return { error: error.message };

  revalidatePath("/dashboard/admin/users");
  return { success: "Role updated." };
}
