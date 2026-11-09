import type { Metadata } from "next";
import { JetBrains_Mono, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import { OpeningSplash } from "@/components/branding/OpeningSplash";

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
    "Terminal riset saham Bursa Efek Indonesia dengan pantauan, grafik, peta bisnis, dan data pasar bersumber.",
  icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml", sizes: "any" }], shortcut: "/icon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${jetbrainsMono.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script dangerouslySetInnerHTML={{ __html: "try{var t=localStorage.getItem('idx-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark';document.documentElement.style.colorScheme=t==='light'?'light':'dark';document.documentElement.lang=localStorage.getItem('idx-language')==='en'?'en':'id';if(sessionStorage.getItem('idx-opening-seen-v1')==='1')document.documentElement.dataset.idxSplash='skip'}catch(e){}" }} />
        <OpeningSplash />
        {children}
      </body>
    </html>
  );
}
