"use client";

import { useActionState } from "react";
import { dismissTutorCode, type ActionState } from "@/lib/actions/tutorCodes";
import { Button } from "@/components/ui/Button";

const initialState: ActionState = {};

export function DismissTutorCodeButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState(dismissTutorCode, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="ghost" size="sm" disabled={pending}>
        {pending ? "Clearing…" : "Dismiss"}
      </Button>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
