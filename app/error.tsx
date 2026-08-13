"use client";

import { DatabaseUnavailable } from "@/components/ui/DatabaseUnavailable";

// Catches any uncaught throw from a Server Component render or a Server
// Action, most commonly a Supabase call failing outright because the
// project is paused or unreachable (a real connection failure throws,
// unlike a normal query error which comes back as { error } and is
// handled inline wherever it happens).
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <DatabaseUnavailable digest={error.digest} onRetry={unstable_retry} />
  );
}
