"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export interface ActionState {
  error?: string;
  success?: string;
}

// No session exists when someone clicks an unsubscribe link from their
// email, so this can't go through the normal RLS-backed client. The
// token itself is the only credential, a random, unguessable value
// that's never shown anywhere except inside that person's own emails.
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

// Same token, opposite direction. There's no separate "resubscribe"
// link sent anywhere, the unsubscribe page itself offers this once it
// sees the person is already unsubscribed, so any old notification
// email's link still works as the way back in.
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
