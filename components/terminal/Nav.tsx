"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/navigation";

export function Nav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Terminal sections"
      className="terminal-nav flex min-w-0 items-stretch gap-px overflow-x-auto bg-rule"
    >
      {NAV_ITEMS.map((tab) => {
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
            <span className="hidden min-[1150px]:inline">{tab.label}</span>
            <span className="min-[1150px]:hidden">{tab.shortLabel ?? tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
