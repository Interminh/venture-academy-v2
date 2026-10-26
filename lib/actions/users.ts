"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

export interface ActionState {
  error?: string;
  success?: string;
}

// Admin-only role change. Admins can't change their own role.
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

// Hides an account from the admin table. Admins can't dismiss themselves.
export async function dismissAccount(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const targetId = String(formData.get("userId") ?? "");
  if (targetId === user.id) {
    return { error: "You can't remove your own account here." };
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ admin_dismissed_at: new Date().toISOString() })
    .eq("id", targetId)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "This account can no longer be removed." };
  }

  revalidatePath("/dashboard/admin/users");
  return { success: "Account removed from the list." };
}
