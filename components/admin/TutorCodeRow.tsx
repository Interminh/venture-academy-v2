"use client";

import { useActionState } from "react";
import { toggleTutorCodeActive, type ActionState } from "@/lib/actions/tutorCodes";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const initialState: ActionState = {};

export function TutorCodeRow({
  id,
  code,
  isActive,
}: {
  id: string;
  code: string;
  isActive: boolean;
}) {
  const [, formAction, pending] = useActionState(toggleTutorCodeActive, initialState);

  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-sm font-medium text-ink">{code}</span>
        <Badge tone={isActive ? "success" : "neutral"}>{isActive ? "Active" : "Inactive"}</Badge>
      </div>
      <form action={formAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="isActive" value={String(isActive)} />
        <Button type="submit" variant="ghost" size="sm" disabled={pending}>
          {isActive ? "Deactivate" : "Reactivate"}
        </Button>
      </form>
    </div>
  );
}
