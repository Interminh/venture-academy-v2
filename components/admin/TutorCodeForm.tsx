"use client";

import { useActionState } from "react";
import { createTutorCode, type ActionState } from "@/lib/actions/tutorCodes";
import { Button } from "@/components/ui/Button";
import { Input, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

export function TutorCodeForm() {
  const [state, formAction, pending] = useActionState(createTutorCode, initialState);

  return (
    <form action={formAction} className="flex items-start gap-2">
      <div className="flex-1">
        <Input name="code" placeholder="e.g. VAT-TUTOR-2026" required />
        <FieldError message={state.error} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add code"}
      </Button>
    </form>
  );
}
