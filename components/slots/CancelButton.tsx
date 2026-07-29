"use client";

import { useActionState } from "react";
import { cancelOwnClaim, type ActionState } from "@/lib/actions/claims";
import { Button } from "@/components/ui/Button";

const initialState: ActionState = {};

export function CancelButton({ claimId }: { claimId: string }) {
  const [state, formAction, pending] = useActionState(cancelOwnClaim, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="claimId" value={claimId} />
      <Button type="submit" variant="danger" size="sm" disabled={pending}>
        {pending ? "Cancelling…" : "Cancel booking"}
      </Button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
