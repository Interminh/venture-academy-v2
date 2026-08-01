"use client";

import { useActionState } from "react";
import { deleteHours, type ActionState } from "@/lib/actions/hours";
import { Button } from "@/components/ui/Button";

const initialState: ActionState = {};

export function HoursLogRow({
  id,
  sessionDate,
  hours,
  studentLabel,
  description,
}: {
  id: string;
  sessionDate: string;
  hours: number;
  studentLabel: string;
  description: string | null;
}) {
  const [, formAction, pending] = useActionState(deleteHours, initialState);

  return (
    <tr className="border-b border-border last:border-0">
      <td className="p-3 whitespace-nowrap text-body">
        {new Date(sessionDate + "T00:00:00").toLocaleDateString()}
      </td>
      <td className="p-3 font-medium text-ink">{hours}</td>
      <td className="p-3 text-ink">{studentLabel}</td>
      <td className="p-3 text-body">{description ?? "-"}</td>
      <td className="p-3 text-right">
        <form action={formAction}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="ghost" size="sm" disabled={pending}>
            {pending ? "Removing…" : "Remove"}
          </Button>
        </form>
      </td>
    </tr>
  );
}
