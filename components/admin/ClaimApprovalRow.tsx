"use client";

import { useActionState } from "react";
import { approveClaim, rejectClaim, type ActionState } from "@/lib/actions/claims";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatTimeRange, WEEKDAY_LABELS } from "@/lib/utils/slots";
import type { Weekday } from "@/lib/types/database";

const initialState: ActionState = {};

export function ClaimApprovalRow({
  claimId,
  tutorName,
  tuteeLabel,
  subjectName,
  day,
  startTime,
  requestedAt,
}: {
  claimId: string;
  tutorName: string;
  tuteeLabel: string;
  subjectName: string;
  day: Weekday;
  startTime: string;
  requestedAt: string;
}) {
  const [approveState, approveAction, approvePending] = useActionState(approveClaim, initialState);
  const [rejectState, rejectAction, rejectPending] = useActionState(rejectClaim, initialState);

  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-ink">
          {tutorName} → {tuteeLabel}
        </p>
        <p className="text-sm text-body">
          {subjectName} · {WEEKDAY_LABELS[day]} {formatTimeRange(startTime)}
        </p>
        <p className="text-xs text-gray-400">
          Requested {new Date(requestedAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex gap-2">
          <form action={rejectAction}>
            <input type="hidden" name="claimId" value={claimId} />
            <Button type="submit" variant="danger" size="sm" disabled={rejectPending || approvePending}>
              Reject
            </Button>
          </form>
          <form action={approveAction}>
            <input type="hidden" name="claimId" value={claimId} />
            <Button type="submit" size="sm" disabled={rejectPending || approvePending}>
              Approve
            </Button>
          </form>
        </div>
        {approveState.error && <p className="text-xs text-red-600">{approveState.error}</p>}
        {rejectState.error && <p className="text-xs text-red-600">{rejectState.error}</p>}
      </div>
    </Card>
  );
}
