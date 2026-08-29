// Collapsible disclosure for dismissed items. Closed by default so a
// cleared-out claim or student stays out of the way, but nothing is ever
// actually hidden from the admin, just tucked behind this arrow. Native
// <details>/<summary> instead of a client component: no JS needed to
// track open/closed state, and it stays keyboard- and screen-reader
// accessible for free.
export function DismissedPanel({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  if (count === 0) return null;

  return (
    <details className="group mt-4 rounded-xl border border-border bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between p-3 text-sm font-medium text-body [&::-webkit-details-marker]:hidden">
        <span>
          Dismissed <span className="text-gray-400">({count})</span>
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 text-gray-400 transition-transform duration-200 group-open:rotate-180"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="border-t border-border">{children}</div>
    </details>
  );
}
