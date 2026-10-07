"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";
import { useProfileLanguage } from "@/components/profile/LanguageControl";

const INDONESIAN_LABELS: Record<string, string> = {
  "/dashboard": "Beranda", "/watchlist": "Pantauan", "/top10": "Top 10",
  "/foreign-flow": "Arus Asing", "/hot": "Hot", "/market": "Pasar",
  "/sector": "Sector", "/overview": "Overview", "/free-float": "Free Float", "/konglo": "Konglo", "/lokasi-bisnis": "Lokasi Bisnis",
  "/ai-analyst": "AI Analyst", "/extension": "Extension", "/research": "Research", "/stream": "Stream", "/account": "Profil",
};

const extensionIndex = NAV_ITEMS.findIndex((item) => item.href === "/extension");
const PRIMARY_ITEMS = NAV_ITEMS.slice(0, extensionIndex + 1);
const MORE_ITEMS = NAV_ITEMS.slice(extensionIndex + 1);

export function Nav({ preview = false, headerTrigger = false, desktopOnly = false }: { preview?: boolean; headerTrigger?: boolean; desktopOnly?: boolean }) {
  const pathname = usePathname();
  const language = useProfileLanguage();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const labelFor = (href: string, fallback: string) => language === "id" ? INDONESIAN_LABELS[href] ?? fallback : fallback;
  const hrefFor = (href: string) => preview && href === "/dashboard" ? "/preview" : preview && href === "/lokasi-bisnis" ? "/preview/lokasi-bisnis" : href;
  const isActive = (href: string) => pathname === hrefFor(href) || (hrefFor(href) !== "/preview" && pathname.startsWith(`${hrefFor(href)}/`));
  const activeItem = NAV_ITEMS.find((item) => isActive(item.href));

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const triggerButton = trigger.current;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const focusable = [...(drawer.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [])].filter((element) => element.getClientRects().length > 0);
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      triggerButton?.focus();
    };
  }, [open]);

  return <>
    {!desktopOnly && <div className={headerTrigger ? "flex shrink-0 items-center bg-panel pl-1 sm:pl-2" : "flex min-w-0 items-center justify-between bg-panel-hi px-3 py-1 lg:hidden"}>
      <button ref={trigger} type="button" aria-label="Buka menu" aria-expanded={open} aria-controls="mobile-terminal-menu" onClick={() => setOpen(true)} className={headerTrigger ? "inline-flex h-11 w-11 items-center justify-center text-amber focus-visible:outline-2 focus-visible:outline-amber" : "inline-flex min-h-10 items-center gap-2 px-2 text-xs font-bold uppercase tracking-wider text-amber focus-visible:outline-2 focus-visible:outline-amber"}>
        <Menu className="h-5 w-5" aria-hidden="true" />{!headerTrigger && "Menu"}
      </button>
      {!headerTrigger && activeItem && <span className="flex min-w-0 items-center gap-1.5 truncate text-xs font-semibold uppercase tracking-wider text-ink-hi"><activeItem.icon aria-hidden="true" className="h-4 w-4 shrink-0 text-amber" />{labelFor(activeItem.href, activeItem.label)}</span>}
    </div>}

    {!headerTrigger && <nav aria-label={preview ? "Menu pratinjau terminal" : "Menu terminal"} className="terminal-nav hidden min-w-0 items-stretch gap-px overflow-hidden bg-rule lg:flex">
      {PRIMARY_ITEMS.map((tab) => {
        const label = labelFor(tab.href, tab.label);
        const shortLabel = language === "id" && tab.href === "/foreign-flow" ? "Arus" : tab.shortLabel ?? label;
        const active = isActive(tab.href);
        return <Link key={tab.href} href={hrefFor(tab.href)} aria-label={label} title={label} aria-current={active ? "page" : undefined} className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-2 py-2 text-xs font-semibold uppercase tracking-[0.06em] transition-colors ${active ? "bg-panel font-bold text-amber shadow-[inset_0_-2px_0_0_var(--color-amber)]" : "bg-panel-hi text-ink hover:bg-panel hover:text-ink-hi"}`}><tab.icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /><span className="hidden min-[1280px]:inline min-[1600px]:hidden">{shortLabel}</span><span className="hidden min-[1600px]:inline">{label}</span></Link>;
      })}
    </nav>}

    {open && <div id="mobile-terminal-menu" className="fixed inset-0 z-[100]">
      <button type="button" className="absolute inset-0 bg-black/70" aria-label="Tutup menu" onClick={() => setOpen(false)} />
      <nav ref={drawer} aria-label="Menu terminal" role="dialog" aria-modal="true" className="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col border-r border-rule bg-panel shadow-2xl">
        <div className="flex min-h-14 items-center justify-between border-b border-rule px-4"><strong className="font-display text-sm uppercase tracking-widest text-amber">IDX / Terminal</strong><button ref={close} type="button" onClick={() => setOpen(false)} aria-label="Tutup menu" className="flex h-10 w-10 items-center justify-center text-ink focus-visible:outline-2 focus-visible:outline-amber"><X className="h-5 w-5" /></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return <Link key={item.href} href={hrefFor(item.href)} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} className={`flex min-h-12 items-center gap-3 border-l-2 px-3 text-sm font-semibold lg:hidden ${active ? "border-amber bg-amber/10 font-bold text-amber" : "border-transparent text-ink hover:bg-panel-hi hover:text-ink-hi"}`}><item.icon aria-hidden="true" className="h-4 w-4 shrink-0" />{labelFor(item.href, item.label)}</Link>;
          })}
          {MORE_ITEMS.map((item) => {
            const active = isActive(item.href);
            return <Link key={`desktop-${item.href}`} href={hrefFor(item.href)} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)} className={`hidden min-h-12 items-center gap-3 border-l-2 px-3 text-sm font-semibold lg:flex ${active ? "border-amber bg-amber/10 font-bold text-amber" : "border-transparent text-ink hover:bg-panel-hi hover:text-ink-hi"}`}><item.icon aria-hidden="true" className="h-4 w-4 shrink-0" />{labelFor(item.href, item.label)}</Link>;
          })}
        </div>
      </nav>
    </div>}
  </>;
}
