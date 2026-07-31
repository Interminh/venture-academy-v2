"use client";

import { useActionState } from "react";
import { toggleSubjectActive, type ActionState } from "@/lib/actions/subjects";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const initialState: ActionState = {};

export function SubjectRow({
  id,
  name,
  isActive,
}: {
  id: string;
  name: string;
  isActive: boolean;
}) {
  const [state, formAction, pending] = useActionState(toggleSubjectActive, initialState);

  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <div className="flex items-center gap-2.5">
        <span className="font-medium text-ink">{name}</span>
        <Badge tone={isActive ? "success" : "neutral"}>{isActive ? "Active" : "Inactive"}</Badge>
      </div>
      <div className="flex flex-col items-end gap-1">
        <form action={formAction}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="isActive" value={String(isActive)} />
          <Button type="submit" variant="ghost" size="sm" disabled={pending}>
            {isActive ? "Deactivate" : "Reactivate"}
          </Button>
        </form>
        {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      </div>
    </div>
  );
}
