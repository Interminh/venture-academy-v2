"use client";

import { useActionState } from "react";
import { toggleTutorCodeActive, type ActionState } from "@/lib/actions/tutorCodes";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DismissTutorCodeButton } from "./DismissTutorCodeButton";

const initialState: ActionState = {};

export function TutorCodeRow({
  id,
  code,
  isActive,
  dismissed = false,
}: {
  id: string;
  code: string;
  isActive: boolean;
  dismissed?: boolean;
}) {
  const [state, formAction, pending] = useActionState(toggleTutorCodeActive, initialState);

  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-sm font-medium text-ink">{code}</span>
        <Badge tone={isActive ? "success" : "neutral"}>{isActive ? "Active" : "Inactive"}</Badge>
      </div>
      {!dismissed && (
        <div className="flex flex-col items-end gap-1">
          {isActive ? (
            <form action={formAction}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="isActive" value={String(isActive)} />
              <Button type="submit" variant="ghost" size="sm" disabled={pending}>
                Deactivate
              </Button>
            </form>
          ) : (
            <div className="flex gap-2">
              <form action={formAction}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="isActive" value={String(isActive)} />
                <Button type="submit" variant="ghost" size="sm" disabled={pending}>
                  Reactivate
                </Button>
              </form>
              <DismissTutorCodeButton id={id} />
            </div>
          )}
          {state.error && <p className="text-xs text-red-600">{state.error}</p>}
        </div>
      )}
    </div>
  );
}
