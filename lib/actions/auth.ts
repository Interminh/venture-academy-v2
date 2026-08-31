"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface ActionState {
  error?: string;
  success?: string;
}

// Both parents and tutors sign up through this same form. Role is never
// read directly off the submitted form, a client can't just request
// role=tutor. Instead, an optional tutor code is checked server-side
// through `is_valid_tutor_code`, a security-definer function that can
// confirm a code is valid without this (unauthenticated) request ever
// being able to read the codes table itself. No code means parent. A
// valid code means tutor. An invalid code is rejected outright, so a
// typo doesn't silently create a parent account for someone who meant
// to sign up as a tutor.
export async function signUp(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const tutorCode = String(formData.get("tutorCode") ?? "").trim();
  const notificationsAcknowledged = formData.get("notificationsAcknowledged") === "on";

  if (!email || !password || !displayName) {
    return { error: "Please fill in every field." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (!notificationsAcknowledged) {
    return { error: "Please acknowledge the notification email notice before continuing." };
  }

  const supabase = await createClient();

  // Supabase's own signUp silently "succeeds" with no error and no session
  // for an already-registered email (anti-enumeration behavior), which
  // would otherwise show this person a "check your email" message for a
  // confirmation email that's never coming. Checking first gives a real
  // answer instead. Requires migration 0007 (`is_email_registered`); if
  // that hasn't been run yet, fall through to signUp's normal behavior
  // rather than blocking every signup on an RPC that doesn't exist yet.
  const { data: alreadyRegistered, error: checkError } = await supabase.rpc(
    "is_email_registered",
    { input_email: email }
  );
  if (!checkError && alreadyRegistered) {
    return { error: "An account with this email already exists. Try logging in instead." };
  }

  let role: "parent" | "tutor" = "parent";
  if (tutorCode) {
    const { data: isValid, error: codeError } = await supabase.rpc("is_valid_tutor_code", {
      input_code: tutorCode,
    });
    if (codeError) return { error: codeError.message };
    if (!isValid) return { error: "That tutor code isn't valid. Check with a club director." };
    role = "tutor";
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName, role },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If the project requires email confirmation, signUp succeeds but returns
  // no session. Redirecting to /dashboard here would just bounce straight
  // back to /login with no explanation, so tell the user what's next instead.
  if (!data.session) {
    return {
      success: "Almost done. Check your email for a confirmation link before logging in.",
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
    // Needing email confirmation is a different, fixable problem than a
    // wrong password, and looks identical to the user if we collapse both
    // into one generic message, so call it out separately.
    if (error.code === "email_not_confirmed") {
      return { error: "Please confirm your email first. Check your inbox for the confirmation link." };
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

// Sends a recovery link through /auth/callback, which exchanges it for a
// session and lands on /reset-password. Always returns the same success
// message regardless of whether the email is registered, so this can't be
// used to enumerate accounts (unlike signUp's duplicate-email check, this
// one has no legitimate reason to tell the caller which way it went).
export async function requestPasswordReset(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Please enter your email." };

  const supabase = await createClient();
  const originHeaders = await headers();
  const origin =
    originHeaders.get("origin") ?? `https://${originHeaders.get("host")}`;

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  return {
    success:
      "If that email has an account, a reset link is on its way. Don't see it in a few minutes? Check your spam/junk folder.",
  };
}

export async function resetPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "This reset link has expired. Request a new one from the login page." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  redirect("/dashboard");
}
