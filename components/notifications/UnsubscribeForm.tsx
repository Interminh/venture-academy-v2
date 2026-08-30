"use client";

import { useActionState } from "react";
import {
  unsubscribeFromNotifications,
  resubscribeToNotifications,
  type ActionState,
} from "@/lib/actions/notifications";
import { Button } from "@/components/ui/Button";

const initialState: ActionState = {};

export function UnsubscribeForm({ token, enabled }: { token: string; enabled: boolean }) {
  const action = enabled ? unsubscribeFromNotifications : resubscribeToNotifications;
  const [state, formAction, pending] = useActionState(action, initialState);

  if (state.success) {
    return <p className="text-sm text-body">{state.success}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col items-start gap-3">
      <input type="hidden" name="token" value={token} />
      <Button type="submit" variant={enabled ? "danger" : "primary"} disabled={pending}>
        {pending
          ? enabled
            ? "Unsubscribing…"
            : "Turning back on…"
          : enabled
            ? "Unsubscribe me"
            : "Turn notifications back on"}
      </Button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
