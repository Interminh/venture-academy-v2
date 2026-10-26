"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface ActionState {
  error?: string;
  success?: string;
}

// Unsubscribe links have no session, so the unguessable token is the credential.
export async function unsubscribeFromNotifications(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Missing unsubscribe link." };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ notifications_enabled: false })
    .eq("unsubscribe_token", token)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "This unsubscribe link isn't valid." };
  }

  return { success: "You won't get any more session notification emails." };
}

// Resubscribes with the same token from the unsubscribe page.
export async function resubscribeToNotifications(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  if (!token) return { error: "Missing link." };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ notifications_enabled: true })
    .eq("unsubscribe_token", token)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "This link isn't valid." };
  }

  return { success: "You're back on the list for session notification emails." };
}
