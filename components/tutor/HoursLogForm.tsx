"use client";

import { useActionState } from "react";
import { logHours, type ActionState } from "@/lib/actions/hours";
import { Button } from "@/components/ui/Button";
import { Input, Label, Textarea, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

const today = () => new Date().toISOString().slice(0, 10);

export function HoursLogForm() {
  const [state, formAction, pending] = useActionState(logHours, initialState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-4">
      <div>
        <Label htmlFor="sessionDate">Date</Label>
        <Input id="sessionDate" name="sessionDate" type="date" defaultValue={today()} max={today()} required />
      </div>
      <div>
        <Label htmlFor="hours">Hours</Label>
        <Input id="hours" name="hours" type="number" step="0.25" min="0.25" max="24" placeholder="1" required />
      </div>
      <div>
        <Label htmlFor="studentLabel">Student (or other)</Label>
        <Input id="studentLabel" name="studentLabel" placeholder="e.g. Jamie R." required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" rows={1} placeholder="Optional" />
      </div>
      <div className="sm:col-span-4">
        <FieldError message={state.error} />
        <Button type="submit" disabled={pending} size="sm">
          {pending ? "Logging…" : "Log hours"}
        </Button>
      </div>
    </form>
  );
}
