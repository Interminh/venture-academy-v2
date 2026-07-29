import { formatTimeRange } from "@/lib/utils/slots";
import { StatusTrack, type SlotStatus } from "./StatusTrack";
import { Card } from "@/components/ui/Card";

export function SlotRow({
  startTime,
  subjectName,
  tuteeLabel,
  status,
  actions,
}: {
  startTime: string;
  subjectName: string;
  tuteeLabel?: string;
  status: SlotStatus;
  actions?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium text-ink">{formatTimeRange(startTime)}</p>
        <p className="text-sm text-body">
          {subjectName}
          {tuteeLabel && <> · {tuteeLabel}</>}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <StatusTrack status={status} />
        {actions}
      </div>
    </Card>
  );
}
