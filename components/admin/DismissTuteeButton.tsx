"use client";

import { useActionState } from "react";
import { dismissDeletedTutee, type ActionState } from "@/lib/actions/tutees";
import { Button } from "@/components/ui/Button";

const initialState: ActionState = {};

export function DismissTuteeButton({ tuteeId }: { tuteeId: string }) {
  const [state, formAction, pending] = useActionState(dismissDeletedTutee, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="tuteeId" value={tuteeId} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        {pending ? "Clearing…" : "Dismiss"}
      </Button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
