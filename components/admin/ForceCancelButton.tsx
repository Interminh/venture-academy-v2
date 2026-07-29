"use client";

import { useActionState, useState } from "react";
import { forceCancelClaim, type ActionState } from "@/lib/actions/claims";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const initialState: ActionState = {};

export function ForceCancelButton({ claimId }: { claimId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(forceCancelClaim, initialState);

  if (!open) {
    return (
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Force-cancel
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="claimId" value={claimId} />
      <Input
        name="reason"
        placeholder="Reason (optional)"
        className="w-48"
      />
      <div className="flex gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" variant="danger" size="sm" disabled={pending}>
          {pending ? "Working…" : "Confirm"}
        </Button>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
