"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/database";

export interface ActionState {
  error?: string;
  success?: string;
}

// Only route by which tutor/admin accounts get created — public /signup
// can never reach this, and this action re-checks the caller is an admin
// itself (never trust that the UI only shows this page to admins).
export async function inviteUser(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be logged in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Only admins can invite tutor or admin accounts." };
  }

  const email = String(formData.get("email") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const role = String(formData.get("role") ?? "") as UserRole;

  if (!email || !displayName || !["tutor", "admin"].includes(role)) {
    return { error: "Please fill in every field." };
  }

  const serviceClient = createServiceRoleClient();
  const { error } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    data: { display_name: displayName, role },
  });

  if (error) return { error: error.message };

  return { success: `Invite sent to ${email} as ${role}.` };
}
