"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FieldError } from "@/components/ui/Input";
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
  subjectIds: string[];
  slotsBySubject: Record<string, SlotKey[]>;
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
  const [slotsBySubject, setSlotsBySubject] = useState<Map<string, Set<SlotKey>>>(
    new Map(
      Object.entries(existing?.slotsBySubject ?? {}).map(([id, keys]) => [id, new Set(keys)])
    )
  );

  function toggleSubject(id: string) {
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSlot(subjectId: string, key: SlotKey) {
    setSlotsBySubject((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(subjectId) ?? []);
      if (set.has(key)) set.delete(key);
      else set.add(key);
      next.set(subjectId, set);
      return next;
    });
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {existing && <input type="hidden" name="tuteeId" value={existing.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">Student&apos;s first name</Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={existing?.first_name}
            required
          />
        </div>
        <div>
          <Label htmlFor="grade">Grade</Label>
          <Select id="grade" name="grade" defaultValue={existing?.grade ?? ""} required>
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
      </div>

      {[...selectedSubjectIds].length > 0 && (
        <div className="flex flex-col gap-6">
          <Label>Weekly availability</Label>
          {[...selectedSubjectIds].map((subjectId) => {
            const subject = subjects.find((s) => s.id === subjectId);
            if (!subject) return null;
            return (
              <AvailabilityPicker
                key={subjectId}
                subjectId={subjectId}
                subjectName={subject.name}
                selected={slotsBySubject.get(subjectId) ?? new Set()}
                onToggle={(key) => toggleSlot(subjectId, key)}
              />
            );
          })}
        </div>
      )}

      <FieldError message={state.error} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : existing ? "Save changes" : "Add student"}
      </Button>
    </form>
  );
}
