"use client";

import { useActionState } from "react";
import { updateUserRole, type ActionState } from "@/lib/actions/users";
import { Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { DismissAccountButton } from "./DismissAccountButton";
import type { UserRole } from "@/lib/types/database";

const initialState: ActionState = {};

export function UserRoleRow({
  userId,
  displayName,
  email,
  role,
  isSelf,
  dismissed = false,
}: {
  userId: string;
  displayName: string;
  email: string;
  role: UserRole;
  isSelf: boolean;
  dismissed?: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateUserRole, initialState);

  return (
    <tr className="border-b border-border last:border-0">
      <td className="p-3">
        <p className="font-medium text-ink">
          {displayName} {isSelf && <Badge tone="info">You</Badge>}
        </p>
        <p className="text-xs text-gray-400">{email}</p>
      </td>
      <td className="p-3">
        {isSelf || dismissed ? (
          <span className="text-sm text-body capitalize">{role}</span>
        ) : (
          <form action={formAction} className="flex items-center gap-2">
            <input type="hidden" name="userId" value={userId} />
            <Select
              name="role"
              defaultValue={role}
              className="w-auto"
              disabled={pending}
              onChange={(e) => e.target.form?.requestSubmit()}
            >
              <option value="parent">Parent</option>
              <option value="tutor">Tutor</option>
              <option value="admin">Admin</option>
            </Select>
            {state.error && <span className="text-xs text-red-600">{state.error}</span>}
          </form>
        )}
      </td>
      {!dismissed && (
        <td className="p-3 text-right">
          {!isSelf && <DismissAccountButton userId={userId} displayName={displayName} />}
        </td>
      )}
    </tr>
  );
}
