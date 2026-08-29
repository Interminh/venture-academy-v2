"use client";

import { useActionState } from "react";
import { dismissLedgerClaim, type ActionState } from "@/lib/actions/claims";
import { Button } from "@/components/ui/Button";

const initialState: ActionState = {};

export function DismissLedgerClaimButton({ claimId }: { claimId: string }) {
  const [state, formAction, pending] = useActionState(dismissLedgerClaim, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="claimId" value={claimId} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        {pending ? "Clearing…" : "Dismiss"}
      </Button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
