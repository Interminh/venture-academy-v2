"use client";

import { useActionState, useState } from "react";
import { dismissAccount, type ActionState } from "@/lib/actions/users";
import { Button } from "@/components/ui/Button";

const initialState: ActionState = {};

export function DismissAccountButton({
  userId,
  displayName,
}: {
  userId: string;
  displayName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(dismissAccount, initialState);

  if (!open) {
    return (
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        Delete
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <input type="hidden" name="userId" value={userId} />
      <p className="text-xs text-body">
        Remove {displayName}? This only clears them off this list, their
        account keeps working exactly as before.
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
