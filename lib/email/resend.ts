import { Resend } from "resend";

// Plain-text session notifications only, never the password reset flow,
// that one stays on Supabase Auth's own email path regardless of what's
// configured here. Silently no-ops without a key so local dev and a
// project that hasn't set this up yet don't crash on every approval,
// they just don't send anything.
export async function sendPlainEmail({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set, skipping notification email:", subject);
    return;
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "Venture Academy Tutors <onboarding@resend.dev>";

  const { error } = await resend.emails.send({ from, to, subject, text });
  if (error) {
    console.error("Failed to send notification email:", error);
  }
}
