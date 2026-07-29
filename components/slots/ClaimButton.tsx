"use client";

import { useActionState } from "react";
import { submitClaim, type ActionState } from "@/lib/actions/claims";
import { Button } from "@/components/ui/Button";

const initialState: ActionState = {};

export function ClaimButton({ slotId }: { slotId: string }) {
  const [state, formAction, pending] = useActionState(submitClaim, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="slotId" value={slotId} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Claiming…" : "Claim slot"}
      </Button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state.success && <p className="text-xs text-status-open">{state.success}</p>}
    </form>
  );
}
