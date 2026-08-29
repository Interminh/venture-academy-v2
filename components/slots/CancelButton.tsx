"use client";

import { useActionState, useState } from "react";
import { cancelOwnClaim, type ActionState } from "@/lib/actions/claims";
import { Button } from "@/components/ui/Button";

const initialState: ActionState = {};

export function CancelButton({ claimId }: { claimId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(cancelOwnClaim, initialState);

  if (!open) {
    return (
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Cancel booking
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="claimId" value={claimId} />
      <p className="text-xs text-body">Cancel this booking?</p>
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Never mind
        </Button>
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          {pending ? "Cancelling…" : "Confirm cancel"}
        </Button>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
