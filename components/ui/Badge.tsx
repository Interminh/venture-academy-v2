import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "success" | "warning" | "info" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-bg-soft text-body border-border",
  success: "bg-status-open-bg text-status-open border-status-open/20",
  warning: "bg-status-pending-bg text-status-pending border-status-pending/20",
  info: "bg-status-booked-bg text-status-booked border-status-booked/20",
  danger: "bg-red-50 text-red-600 border-red-100",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
