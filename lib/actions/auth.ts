"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export interface ActionState {
  error?: string;
  success?: string;
}

// Role comes from an optional tutor code checked server-side, never from the form.
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

  // Supabase hides duplicate emails on signUp, so check first. Skips if migration 0007 isn't applied.
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

  // No session means email confirmation is required, so say so instead of redirecting.
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
    // Unconfirmed email gets its own message, not the generic wrong-password one.
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

// Always returns the same message so emails can't be enumerated.
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

// Only plain same-origin paths are allowed in `next`, to block open redirects.
function isSafeRedirectPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("@");
}

// Exchanges the recovery code on an explicit click so link scanners can't burn it.
export async function confirmRecovery(formData: FormData) {
  const code = String(formData.get("code") ?? "");
  const requestedNext = String(formData.get("next") ?? "");
  const next = isSafeRedirectPath(requestedNext) ? requestedNext : "/reset-password";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      redirect(next);
    }
  }

  redirect("/login");
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
