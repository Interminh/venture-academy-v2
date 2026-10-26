import fs from "node:fs";
import path from "node:path";

// One run id ties every fake record together so cleanup removes only this run's data.
export const RUN_ID = process.env.VAT_TEST_RUN_ID ?? Date.now().toString(36);

export function testEmail(label: string): string {
  return `vat-qa-${RUN_ID}-${label}@example.com`.toLowerCase();
}

export function testName(label: string): string {
  return `QA ${RUN_ID} ${label}`;
}

const LOG_PATH = path.join(__dirname, "..", "report", `created-${RUN_ID}.json`);

interface CreatedRecord {
  kind: "tutee" | "claim" | "subject" | "tutorCode" | "profile";
  label: string;
  createdAt: string;
}

export function logCreated(kind: CreatedRecord["kind"], label: string) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  const existing: CreatedRecord[] = fs.existsSync(LOG_PATH)
    ? JSON.parse(fs.readFileSync(LOG_PATH, "utf-8"))
    : [];
  existing.push({ kind, label, createdAt: new Date().toISOString() });
  fs.writeFileSync(LOG_PATH, JSON.stringify(existing, null, 2));
}
