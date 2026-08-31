import { headers } from "next/headers";
import { sendPlainEmail } from "./resend";
import { formatTimeRange, WEEKDAY_LABELS } from "@/lib/utils/slots";
import type { Weekday } from "@/lib/types/database";

interface Recipient {
  displayName: string;
  email: string;
  notificationsEnabled: boolean;
  unsubscribeToken: string;
}

async function notificationSettingsUrl(token: string): Promise<string> {
  const originHeaders = await headers();
  const origin = originHeaders.get("origin") ?? `https://${originHeaders.get("host")}`;
  return `${origin}/notifications/unsubscribe?token=${token}`;
}

// Fired once, right after a claim is approved. One email to the parent
// ("a tutor has been confirmed"), one to the tutor ("your request has
// been accepted"), each skipped individually if that person has
// unsubscribed. Plain text, no links except the required unsubscribe
// one, this is a courtesy notice, not a marketing email.
export async function sendSessionBookedNotifications({
  parent,
  tutor,
  studentFirstName,
  subjectName,
  day,
  startTime,
}: {
  parent: Recipient;
  tutor: Recipient;
  studentFirstName: string;
  subjectName: string;
  day: Weekday;
  startTime: string;
}): Promise<void> {
  const when = `${WEEKDAY_LABELS[day]} at ${formatTimeRange(startTime)}`;

  if (parent.notificationsEnabled) {
    const settingsLink = await notificationSettingsUrl(parent.unsubscribeToken);
    await sendPlainEmail({
      to: parent.email,
      subject: `A tutor has been confirmed for ${studentFirstName}`,
      text: [
        `Hello ${parent.displayName},`,
        "",
        `${tutor.displayName} will be tutoring ${studentFirstName} in ${subjectName} on ${when}.`,
        "",
        "- Venture Academy Tutors",
        "",
        "---",
        `You're getting this because you have a student registered with Venture Academy Tutors. Change my notification settings: ${settingsLink}`,
      ].join("\n"),
    });
  }

  if (tutor.notificationsEnabled) {
    const settingsLink = await notificationSettingsUrl(tutor.unsubscribeToken);
    await sendPlainEmail({
      to: tutor.email,
      subject: `Your session with ${studentFirstName} has been accepted`,
      text: [
        `Hello ${tutor.displayName},`,
        "",
        `Your request to tutor ${studentFirstName} in ${subjectName} on ${when} has been accepted.`,
        "",
        "- Venture Academy Tutors",
        "",
        "---",
        `You're getting this because you're a tutor with Venture Academy Tutors. Change my notification settings: ${settingsLink}`,
      ].join("\n"),
    });
  }
}
