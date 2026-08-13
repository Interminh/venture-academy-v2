"use client";

import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";

// Shown when a Supabase call fails outright (paused project, unreachable
// host) instead of returning a normal error response. Used by both
// app/error.tsx (route-segment failures) and app/global-error.tsx (root
// layout failures), which is why the retry behavior is passed in rather
// than hardcoded, error.tsx re-renders the segment, global-error.tsx has
// to reload the page instead.
export function DatabaseUnavailable({
  digest,
  onRetry,
}: {
  digest?: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-soft px-5 py-8">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center gap-2 pl-0.5">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Venture Academy Tutors
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-white p-9 shadow-sm">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-status-booked-bg">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
            >
              <ellipse cx="12" cy="6" rx="7" ry="2.6" />
              <path d="M5 6v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6" />
              <path d="M5 12v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-6" />
            </svg>
          </div>

          <Badge tone="warning" className="mb-4">
            Temporary outage
          </Badge>

          <h1 className="mb-2.5 font-heading text-2xl font-extrabold text-ink text-balance">
            Be right back.
          </h1>

          <p className="max-w-[42ch] text-sm leading-relaxed text-body">
            Our database went quiet for a while and paused itself. It&apos;s
            waking back up now, and this page usually clears on its own
            within a minute.
          </p>

          <div className="mt-6 flex gap-2.5">
            <Button onClick={onRetry}>Try again</Button>
            <ButtonLink href="/" variant="ghost">
              Back to homepage
            </ButtonLink>
          </div>

          <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-gray-400">
            Still stuck after a few minutes?{" "}
            <strong className="font-semibold text-body">
              A club director needs to resume the project
            </strong>{" "}
            from the Supabase dashboard, it doesn&apos;t come back on its own
            after that long.
          </p>

          {digest && (
            <p className="mt-4 font-mono text-[11px] text-gray-400">
              Error digest {digest}
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Questions in the meantime? Reach the club at{" "}
          <a
            href="mailto:ventureacademy20@gmail.com"
            className="font-semibold text-primary hover:underline"
          >
            ventureacademy20@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
