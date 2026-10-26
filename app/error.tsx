"use client";

import { DatabaseUnavailable } from "@/components/ui/DatabaseUnavailable";

// Catches uncaught throws from Server Components and Actions, like an unreachable Supabase.
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
