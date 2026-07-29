"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface ActionState {
  error?: string;
  success?: string;
}

// Public self-signup only ever creates a `parent` account — role is never
// read from the submitted form, so a client can't request 'admin'/'tutor'.
// Tutor/admin accounts are provisioned separately via the admin invite flow.
export async function signUp(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();

  if (!email || !password || !displayName) {
    return { error: "Please fill in every field." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName, role: "parent" },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If the project requires email confirmation, signUp succeeds but returns
  // no session — redirecting to /dashboard here would just bounce straight
  // back to /login with no explanation. Tell the user what's actually next
  // instead of silently failing.
  if (!data.session) {
    return {
      success: "Almost done — check your email for a confirmation link before logging in.",
    };
  }

  redirect("/dashboard");
}

export async function signIn(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Surface the "needs confirmation" case distinctly — it's a different,
    // actionable problem from a wrong password, and looks identical to the
    // user if we collapse both into one generic message.
    if (error.code === "email_not_confirmed") {
      return { error: "Please confirm your email first — check your inbox for the confirmation link." };
    }
    return { error: "Incorrect email or password." };
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
