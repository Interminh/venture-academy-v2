"use client";

import { useActionState } from "react";
import { submitClaim, type ActionState } from "@/lib/actions/claims";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";

const initialState: ActionState = {};

export function ClaimButton({
  slotId,
  subjects,
}: {
  slotId: string;
  subjects: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(submitClaim, initialState);

  if (state.success) {
    return <p className="text-xs text-status-open">{state.success}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="slotId" value={slotId} />
      <div className="flex items-center gap-2">
        <Select name="subjectId" required defaultValue="" className="w-auto">
          <option value="" disabled>
            Subject
          </option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Claiming…" : "Claim"}
        </Button>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
