"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

// A table row with a disclosure arrow in the leftmost cell. Expanding
// reveals a second row spanning the full table width underneath it, used
// wherever an admin table's summary row needs a per-item detail view
// (a student's individual slots, a tutor's individual claims) without
// navigating to a separate page.
export function ExpandableRow({
  children,
  detail,
  colSpan,
  rowClassName,
}: {
  children: React.ReactNode;
  detail: React.ReactNode;
  colSpan: number;
  rowClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr className={rowClassName}>
        <td className="w-8 p-3">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Collapse details" : "Expand details"}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-gray-400 hover:bg-bg-soft hover:text-body"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("h-4 w-4 transition-transform duration-150", open && "rotate-90")}
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </td>
        {children}
      </tr>
      {open && (
        <tr>
          <td colSpan={colSpan} className="border-b border-border bg-bg-soft p-3">
            {detail}
          </td>
        </tr>
      )}
    </>
  );
}
