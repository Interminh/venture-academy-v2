"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Subscribes to claim inserts/updates and refreshes the current Server
// Component tree so a slot's status (Open -> Pending -> Booked) updates
// live for every tutor watching the same page, without a manual reload.
export function RealtimeRefresh({ table = "claims" }: { table?: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => router.refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, router]);

  return null;
}
