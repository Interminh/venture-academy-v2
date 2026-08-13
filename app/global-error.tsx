"use client";

import { Manrope, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { DatabaseUnavailable } from "@/components/ui/DatabaseUnavailable";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Only fires if the root layout itself throws, global-error replaces the
// whole document, so unlike app/error.tsx it has to bring its own html,
// body, fonts, and styles, none of layout.tsx runs underneath it.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <DatabaseUnavailable digest={error.digest} onRetry={unstable_retry} />
      </body>
    </html>
  );
}
