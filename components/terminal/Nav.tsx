"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/top10", label: "Top 10" },
  { href: "/hot", label: "Hot" },
  { href: "/market", label: "Market" },
  { href: "/account", label: "Account" },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Terminal sections"
      className="flex items-stretch gap-px overflow-x-auto bg-rule"
    >
      {TABS.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap px-4 py-2 text-xs uppercase tracking-[0.12em] transition-colors ${
              active
                ? "bg-panel text-amber shadow-[inset_0_-2px_0_0_var(--color-amber)]"
                : "bg-panel-hi text-dim hover:bg-panel hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
