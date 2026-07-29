"use client";

import { useActionState } from "react";
import { createSubject, type ActionState } from "@/lib/actions/subjects";
import { Button } from "@/components/ui/Button";
import { Input, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

export function SubjectForm() {
  const [state, formAction, pending] = useActionState(createSubject, initialState);

  return (
    <form action={formAction} className="flex items-start gap-2">
      <div className="flex-1">
        <Input name="name" placeholder="New subject name" required />
        <FieldError message={state.error} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding…" : "Add subject"}
      </Button>
    </form>
  );
}
