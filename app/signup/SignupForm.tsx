"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signUp, type ActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldError } from "@/components/ui/Input";

const initialState: ActionState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const [isTutor, setIsTutor] = useState(false);
  // Server Actions reset every field once the action resolves, even on
  // error, so an invalid tutor code or a rejected password would otherwise
  // wipe the name/email/code the user already typed correctly.
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [tutorCode, setTutorCode] = useState("");

  if (state.success) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-sm text-ink">{state.success}</p>
        <Link href="/login" className="font-medium text-primary hover:underline">
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <Label htmlFor="displayName">Your name</Label>
        <Input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="name"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
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
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-body">
        <input
          type="checkbox"
          checked={isTutor}
          onChange={(e) => setIsTutor(e.target.checked)}
          className="h-4 w-4 cursor-pointer accent-primary"
        />
        I&apos;m signing up as a tutor
      </label>

      {isTutor && (
        <div>
          <Label htmlFor="tutorCode">Tutor code</Label>
          <Input
            id="tutorCode"
            name="tutorCode"
            type="text"
            placeholder="Get this from a club director"
            autoComplete="off"
            required
            value={tutorCode}
            onChange={(e) => setTutorCode(e.target.value)}
          />
        </div>
      )}

      <FieldError message={state.error} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-gray-400">
        That&apos;s all we ask for, plus your student&apos;s tutoring needs.
        Our official VAT email address will also be used to send you
        update notifications (tutor has been confirmed, request has been
        accepted), so please check your junk/spam! *Can unsubscribe
        anytime
      </p>
      <p className="text-center text-sm text-body">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
