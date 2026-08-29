import { cn } from "@/lib/utils/cn";
import { gradeLabel } from "@/lib/utils/slots";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";

export function StudentCard({
  firstName,
  grade,
  subjectNames,
  openCount,
  isFullyBooked,
  isMaxPending,
  isSelected,
  onClick,
}: {
  firstName: string;
  grade: number;
  subjectNames: string[];
  openCount: number;
  isFullyBooked: boolean;
  isMaxPending: boolean;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={cn(
        "flex cursor-pointer flex-col gap-2.5 rounded-xl border bg-white p-4 text-left shadow-sm transition-colors duration-150",
        isSelected ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-center gap-2.5">
        <Avatar name={firstName} size="sm" />
        <div>
          <p className="font-medium text-ink">{firstName}</p>
          <p className="text-xs text-body">{gradeLabel(grade)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {subjectNames.map((name) => (
          <Badge key={name} tone="neutral">
            {name}
          </Badge>
        ))}
      </div>
      {isFullyBooked ? (
        <Badge tone="info">Fully booked</Badge>
      ) : isMaxPending ? (
        <Badge tone="warning">Max sessions pending</Badge>
      ) : (
        <Badge tone={openCount > 0 ? "success" : "neutral"}>
          {openCount > 0 ? `${openCount} open time${openCount === 1 ? "" : "s"}` : "No open times"}
        </Badge>
      )}
    </button>
  );
}
