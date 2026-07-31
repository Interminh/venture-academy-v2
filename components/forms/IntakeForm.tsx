"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea, FieldError } from "@/components/ui/Input";
import { AvailabilityPicker, type SlotKey } from "./AvailabilityPicker";
import { createTutee, updateTutee, type ActionState } from "@/lib/actions/tutees";

const initialState: ActionState = {};

interface Subject {
  id: string;
  name: string;
}

interface ExistingTutee {
  id: string;
  first_name: string;
  grade: number;
  notes: string | null;
  maxWeeklySessions: number | null;
  subjectIds: string[];
  slots: SlotKey[];
}

export function IntakeForm({
  subjects,
  existing,
}: {
  subjects: Subject[];
  existing?: ExistingTutee;
}) {
  const action = existing ? updateTutee : createTutee;
  const [state, formAction, pending] = useActionState(action, initialState);

  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(
    new Set(existing?.subjectIds ?? [])
  );
  const [slots, setSlots] = useState<Set<SlotKey>>(new Set(existing?.slots ?? []));
  // Server Actions reset every uncontrolled field once the action resolves,
  // even on a validation error, so a forgotten subject checkbox would
  // otherwise wipe the name/grade the parent already filled in.
  const [firstName, setFirstName] = useState(existing?.first_name ?? "");
  const [grade, setGrade] = useState<string>(existing?.grade?.toString() ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [maxWeeklySessions, setMaxWeeklySessions] = useState(
    existing?.maxWeeklySessions?.toString() ?? ""
  );

  function toggleSubject(id: string) {
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSlot(key: SlotKey) {
    setSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {existing && <input type="hidden" name="tuteeId" value={existing.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">Student&apos;s name</Label>
          <Input
            id="firstName"
            name="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="grade">Grade</Label>
          <Select
            id="grade"
            name="grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            required
          >
            <option value="" disabled>
              Select grade
            </option>
            <option value={0}>Kindergarten</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label>Subjects needed</Label>
        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => {
            const isChecked = selectedSubjectIds.has(subject.id);
            return (
              <label
                key={subject.id}
                className={
                  "cursor-pointer rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors " +
                  (isChecked
                    ? "border-primary bg-status-booked-bg text-primary"
                    : "border-border bg-white text-body hover:border-primary/50")
                }
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isChecked}
                  onChange={() => toggleSubject(subject.id)}
                />
                {isChecked && <input type="hidden" name="subjectId" value={subject.id} />}
                {subject.name}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-gray-400">
          One shared schedule below. A tutor picks which of these subjects
          they&apos;re helping with when they claim a time.
        </p>
      </div>

      <div>
        <Label htmlFor="maxWeeklySessions">Max sessions per week (optional)</Label>
        <Input
          id="maxWeeklySessions"
          name="maxWeeklySessions"
          type="number"
          min={1}
          placeholder="No limit"
          className="max-w-40"
          value={maxWeeklySessions}
          onChange={(e) => setMaxWeeklySessions(e.target.value)}
        />
        <p className="mt-1.5 text-xs text-gray-400">
          Once this many sessions are booked in a week, we&apos;ll flag this student as fully booked.
        </p>
      </div>

      <div>
        <Label htmlFor="notes">Additional information (optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Anything a tutor or director should know — learning style, prior tutors, scheduling constraints, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <AvailabilityPicker selected={slots} onToggle={toggleSlot} />

      <FieldError message={state.error} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : existing ? "Save changes" : "Add student"}
      </Button>
    </form>
  );
}
