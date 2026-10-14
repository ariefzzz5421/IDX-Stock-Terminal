"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { ChartNoAxesCombined, Flame, Puzzle, Star, X } from "lucide-react";
import { setTrendingExtensionEnabled } from "@/lib/trending-extension";
import { setMobileExtensionEnabled, VOLUME_EXTENSION_COOKIE, WATCHLIST_EXTENSION_COOKIE } from "@/lib/mobile-extensions";

export type ExtensionState = { trending: boolean; watchlist: boolean; volume: boolean };
type ExtensionKey = keyof ExtensionState;

const options = [
  { key: "trending", title: "Top 10 Trending", detail: "Panel peringkat volume saham", icon: Flame },
  { key: "watchlist", title: "Pantauan ponsel", detail: "Saham yang kamu simpan", icon: Star },
  { key: "volume", title: "Volume sesi terakhir", detail: "Peringkat volume terbaru", icon: ChartNoAxesCombined },
] as const;

function save(key: ExtensionKey, enabled: boolean) {
  if (key === "trending") setTrendingExtensionEnabled(enabled);
  if (key === "watchlist") setMobileExtensionEnabled(WATCHLIST_EXTENSION_COOKIE, enabled);
  if (key === "volume") setMobileExtensionEnabled(VOLUME_EXTENSION_COOKIE, enabled);
}

export function ExtensionSettings({ initial, compact = false }: { initial: ExtensionState; compact?: boolean }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [open, setOpen] = useState(false);
  const [confirmKey, setConfirmKey] = useState<ExtensionKey | null>(null);
  const [pending, startTransition] = useTransition();
  const confirmButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirmKey) return;
    confirmButton.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setConfirmKey(null); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [confirmKey]);

  const chosen = options.find((option) => option.key === confirmKey);
  const nextEnabled = confirmKey ? !state[confirmKey] : false;

  function apply() {
    if (!confirmKey) return;
    save(confirmKey, nextEnabled);
    setState((current) => ({ ...current, [confirmKey]: nextEnabled }));
    setConfirmKey(null);
    startTransition(() => router.refresh());
  }

  const rows = <div className="divide-y divide-rule" aria-label="Daftar extension">
    {options.map((option) => {
      const Icon = option.icon;
      return <div key={option.key} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 sm:px-4">
        <Icon className="h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
        <div className="min-w-0"><strong className="block truncate text-xs text-ink-hi">{option.title}</strong><span className="block truncate text-[10px] text-dim">{option.detail}</span></div>
        <button type="button" role="switch" aria-checked={state[option.key]} aria-label={`${state[option.key] ? "Nonaktifkan" : "Aktifkan"} ${option.title}`} onClick={() => setConfirmKey(option.key)} disabled={pending} className={`min-h-9 min-w-16 border px-2 text-[10px] font-bold uppercase disabled:opacity-50 ${state[option.key] ? "border-up/50 bg-up/10 text-up" : "border-rule-hi text-dim hover:border-amber hover:text-amber"}`}>{state[option.key] ? "On" : "Off"}</button>
      </div>;
    })}
  </div>;

  return <div className={compact ? "relative flex h-full items-stretch" : "border border-rule-hi bg-panel"}>
    {compact ? <><button type="button" aria-label="Pengaturan extension" aria-expanded={open} aria-controls="extension-quick-menu" title="Extension" onClick={() => setOpen((value) => !value)} className="grid h-full min-h-11 w-9 shrink-0 place-items-center border-r border-rule text-ink transition-colors hover:bg-panel-hi hover:text-amber sm:w-10"><Puzzle className="h-4 w-4" aria-hidden="true" /></button>{open && <div id="extension-quick-menu" className="absolute right-0 top-full z-[90] w-[min(22rem,calc(100vw-1rem))] border border-rule-hi bg-panel shadow-2xl"><div className="flex items-center justify-between border-b border-rule bg-panel-hi px-3 py-2"><strong className="text-xs uppercase tracking-wider text-amber">Extension</strong><button type="button" onClick={() => setOpen(false)} aria-label="Tutup daftar extension" className="grid h-9 w-9 place-items-center text-dim hover:text-ink-hi"><X className="h-4 w-4" /></button></div>{rows}</div>}</> : <><header className="border-b border-rule bg-panel-hi px-4 py-3"><h2 className="font-display text-sm font-bold text-ink-hi">Extension aktif</h2><p className="mt-1 text-xs text-dim">Atur panel yang muncul di terminal.</p></header>{rows}</>}
    {chosen && <div className="fixed inset-0 z-[1200] grid place-items-center bg-black/70 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmKey(null); }}><div role="alertdialog" aria-modal="true" aria-labelledby="extension-confirm-title" aria-describedby="extension-confirm-description" className="w-full max-w-sm border border-amber/60 bg-panel p-5 shadow-2xl"><h2 id="extension-confirm-title" className="font-display text-base font-bold text-ink-hi">{nextEnabled ? "Aktifkan" : "Nonaktifkan"} {chosen.title}?</h2><p id="extension-confirm-description" className="mt-2 text-xs leading-5 text-dim">{nextEnabled ? "Tombol panel akan muncul di terminal setelah diaktifkan." : "Tombol panel ini akan hilang dari terminal."}</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setConfirmKey(null)} className="min-h-10 border border-rule-hi px-4 text-xs text-ink-hi">Batal</button><button ref={confirmButton} type="button" onClick={apply} className="min-h-10 border border-amber bg-amber px-4 text-xs font-bold text-void">Ya, {nextEnabled ? "aktifkan" : "nonaktifkan"}</button></div></div></div>}
  </div>;
}
