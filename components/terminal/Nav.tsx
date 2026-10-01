"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/navigation";
import { useProfileLanguage } from "@/components/profile/LanguageControl";

const INDONESIAN_LABELS: Record<string, { label: string; shortLabel?: string }> = {
  "/dashboard": { label: "Beranda" },
  "/watchlist": { label: "Pantauan" },
  "/top10": { label: "Top 10" },
  "/foreign-flow": { label: "Arus Asing", shortLabel: "Arus" },
  "/hot": { label: "Hot" },
  "/market": { label: "Pasar" },
  "/sector": { label: "Sector" },
  "/konglo": { label: "Konglo" },
  "/lokasi-bisnis": { label: "Lokasi Bisnis", shortLabel: "Lokasi" },
  "/ai-analyst": { label: "AI Analyst", shortLabel: "AI" },
  "/account": { label: "Profil" },
};

export function Nav() {
  const pathname = usePathname();
  const language = useProfileLanguage();

  return (
    <nav
      aria-label="Menu terminal"
      className="terminal-nav flex min-w-0 items-stretch gap-px overflow-x-auto bg-rule"
    >
      {NAV_ITEMS.map((tab) => {
        const labels = language === "id" ? INDONESIAN_LABELS[tab.href] : undefined;
        const label = labels?.label ?? tab.label;
        const shortLabel = labels?.shortLabel ?? tab.shortLabel ?? label;
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2 text-xs uppercase tracking-[0.08em] transition-colors ${
              active
                ? "bg-panel text-amber shadow-[inset_0_-2px_0_0_var(--color-amber)]"
                : "bg-panel-hi text-dim hover:bg-panel hover:text-ink"
            }`}
          >
            <tab.icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden min-[1150px]:inline">{label}</span>
            <span className="min-[1150px]:hidden">{shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
