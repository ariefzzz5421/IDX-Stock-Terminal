import type { Metadata } from "next";
import { JetBrains_Mono, IBM_Plex_Mono } from "next/font/google";
import { missingSettings } from "@/lib/config";
import { SetupRequired } from "@/components/SetupRequired";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

// Reserved for panel headers and the command bar, where the slightly wider
// letterforms hold up better under uppercase tracking.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "IDX Terminal",
  description:
    "A Bloomberg-style terminal for the Indonesia Stock Exchange — live watchlist, charts, curated news and pump detection.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  // Every route needs a database and a session key, so an unconfigured
  // deployment is answered once here rather than crashing per route.
  const missing = missingSettings();

  return (
    <html
      lang="en"
      className={`${jetbrainsMono.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {missing.length > 0 ? <SetupRequired missing={missing} /> : children}
      </body>
    </html>
  );
}
