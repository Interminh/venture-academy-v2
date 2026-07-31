import { cn } from "@/lib/utils/cn";

export type SlotStatus = "open" | "pending" | "booked" | "cancelled" | "rejected";

const STAGES: { key: "open" | "pending" | "booked"; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "pending", label: "Pending" },
  { key: "booked", label: "Booked" },
];

const STAGE_INDEX: Record<string, number> = { open: 0, pending: 1, booked: 2 };

const DOT_COLOR: Record<string, string> = {
  open: "bg-status-open",
  pending: "bg-status-pending",
  booked: "bg-status-booked",
};

const RING_COLOR: Record<string, string> = {
  open: "ring-status-open",
  pending: "ring-status-pending",
  booked: "ring-status-booked",
};

const END_STATE_STYLES: Record<"cancelled" | "rejected", string> = {
  cancelled: "bg-status-cancelled-bg text-status-cancelled",
  rejected: "bg-status-cancelled-bg text-status-cancelled",
};

// Compact three-stage tracker showing where a slot sits in its lifecycle
// (open -> pending -> booked). Cancelled/rejected claims get a separate
// greyed-out badge instead of a track position since they've dropped out
// of the normal flow rather than moved through it.
export function StatusTrack({
  status,
  className,
}: {
  status: SlotStatus;
  className?: string;
}) {
  if (status === "cancelled" || status === "rejected") {
    const label = status === "cancelled" ? "Cancelled" : "Not approved";
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
          END_STATE_STYLES[status],
          className
        )}
      >
        {label}
      </span>
    );
  }

  const activeIndex = STAGE_INDEX[status];

  return (
    <div className={cn("inline-flex items-center", className)} role="group" aria-label={`Status: ${STAGES[activeIndex].label}`}>
      {STAGES.map((stage, i) => {
        const isReached = i <= activeIndex;
        const isCurrent = i === activeIndex;
        return (
          <div key={stage.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full ring-2 ring-offset-2",
                  isReached ? DOT_COLOR[stage.key] : "bg-gray-200",
                  isCurrent ? RING_COLOR[stage.key] : "ring-transparent"
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "text-[11px] font-medium whitespace-nowrap",
                  isCurrent ? "text-ink" : "text-gray-400"
                )}
              >
                {stage.label}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={cn(
                  "mb-4 h-0.5 w-6 sm:w-10",
                  i < activeIndex ? DOT_COLOR[stage.key] : "bg-gray-200"
                )}
                aria-hidden
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
