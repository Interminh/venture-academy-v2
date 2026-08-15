"use client";

import { useActionState, useState } from "react";
import { deleteTutee, type ActionState } from "@/lib/actions/tutees";
import { Button } from "@/components/ui/Button";

const initialState: ActionState = {};

export function DeleteTuteeButton({
  tuteeId,
  tuteeName,
}: {
  tuteeId: string;
  tuteeName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(deleteTutee, initialState);

  if (!open) {
    return (
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Delete
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="tuteeId" value={tuteeId} />
      <p className="text-xs text-body">
        Remove {tuteeName}? Any pending or booked session cancels first.
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          {pending ? "Removing…" : "Confirm delete"}
        </Button>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
