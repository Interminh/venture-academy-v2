"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { requestPasswordReset, type ActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);
  const [email, setEmail] = useState("");

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-ink">{state.success}</p>
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <FieldError message={state.error} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-body">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
