"use client";

import { useActionState } from "react";
import { inviteUser, type ActionState } from "@/lib/actions/users";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

export function InviteForm() {
  const [state, formAction, pending] = useActionState(inviteUser, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="displayName">Name</Label>
        <Input id="displayName" name="displayName" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="role">Account type</Label>
        <Select id="role" name="role" defaultValue="tutor" required>
          <option value="tutor">Tutor</option>
          <option value="admin">Admin</option>
        </Select>
      </div>
      <FieldError message={state.error} />
      {state.success && <p className="text-sm text-status-open">{state.success}</p>}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Sending…" : "Send invite"}
      </Button>
    </form>
  );
}
