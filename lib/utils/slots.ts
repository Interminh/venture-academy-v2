import type { ClaimStatus, SlotStatusValue, Weekday } from "@/lib/types/database";
import type { SlotStatus } from "@/components/slots/StatusTrack";

// Maps the DB's slot_status.status ("open"|"pending"|"approved") to the
// UI's display vocabulary, where an approved claim is shown as "Booked".
export function toDisplayStatus(status: SlotStatusValue): "open" | "pending" | "booked" {
  return status === "approved" ? "booked" : status;
}

// Maps a claim row's own status (not the derived slot status) to the same
// display vocabulary, for views centered on "my claims" rather than slots.
export function claimToDisplayStatus(status: ClaimStatus): SlotStatus {
  if (status === "approved") return "booked";
  return status;
}

// Postgres `time` columns come back from Supabase as "HH:MM:SS" (e.g.
// "16:00:00"), but every slot key built client-side (checkboxes, claim
// forms) uses "HH:MM" with no seconds. Without normalizing, a DB-sourced
// start_time never matches a client-built key, which is what caused the
// edit form's availability grid to render as if nothing were selected.
export function toHHMM(time: string): string {
  return time.slice(0, 5);
}

export const WEEKDAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri"];

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
};

// Half-hour start times the club tutors 4:00-8:30pm, each session one hour.
export const START_TIMES = [
  "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30",
] as const;

export type StartTime = (typeof START_TIMES)[number];

export function formatTimeRange(startTime: string): string {
  const [h, m] = startTime.split(":").map(Number);
  const startHour12 = h % 12 === 0 ? 12 : h % 12;
  const endTotalMinutes = h * 60 + m + 60;
  const endHour = Math.floor(endTotalMinutes / 60) % 24;
  const endMinute = endTotalMinutes % 60;
  const endHour12 = endHour % 12 === 0 ? 12 : endHour % 12;

  const startLabel = m === 0 ? `${startHour12}` : `${startHour12}:${String(m).padStart(2, "0")}`;
  const endLabel = endMinute === 0 ? `${endHour12}` : `${endHour12}:${String(endMinute).padStart(2, "0")}`;
  const endSuffix = endHour >= 12 ? "PM" : "AM";

  return `${startLabel} - ${endLabel} ${endSuffix}`;
}

export function gradeLabel(grade: number): string {
  if (grade === 0) return "Kindergarten";
  if (grade === 1) return "1st grade";
  if (grade === 2) return "2nd grade";
  if (grade === 3) return "3rd grade";
  return `${grade}th grade`;
}
