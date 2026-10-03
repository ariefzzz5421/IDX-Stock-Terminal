"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Flame, Puzzle, SlidersHorizontal } from "lucide-react";
import { setTrendingExtensionEnabled } from "@/lib/trending-extension";

export function TrendingExtensionControl({ initialEnabled }: { initialEnabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setTrendingExtensionEnabled(next);
    setNotice(next ? "Top 10 Trending aktif. Buka panel melalui tombol di tepi kanan layar." : "Top 10 Trending dinonaktifkan.");
    startTransition(() => router.refresh());
  }

  return <section className="border border-rule-hi bg-panel">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-rule bg-panel-hi p-4 sm:p-5">
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center border border-amber/50 bg-amber/10 text-amber"><Flame className="h-5 w-5" aria-hidden="true" /></span>
        <div className="min-w-0"><h2 className="font-display text-base font-bold text-ink-hi">Top 10 Trending</h2><p className="mt-1 text-xs text-dim">Panel volume saham yang bisa dipindah, dengan filter market cap dan timeframe.</p></div>
      </div>
      <span className={`border px-2.5 py-1 text-micro font-bold uppercase tracking-wider ${enabled ? "border-up/50 bg-up/10 text-up" : "border-rule-hi text-dim"}`}>{enabled ? "Aktif" : "Nonaktif"}</span>
    </div>
    <div className="flex flex-col gap-5 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
      <div className="max-w-2xl text-xs leading-relaxed text-dim"><p>Aktifkan untuk menampilkan tombol panel di tepi kanan. Panel dapat diminimalkan dan dibuka kembali. Gunakan tombol di halaman ini untuk menonaktifkannya.</p><p className="mt-2 flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 shrink-0 text-amber" aria-hidden="true" /> Peringkat berdasarkan volume saham dari snapshot TradingView tertunda.</p></div>
      <button type="button" role="switch" aria-checked={enabled} aria-label="Tampilkan Top 10 Trending" disabled={pending} onClick={toggle} className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border px-5 text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-60 ${enabled ? "border-rule-hi text-ink-hi hover:border-amber" : "border-amber bg-amber text-void hover:brightness-110"}`}><Puzzle className="h-4 w-4" aria-hidden="true" />{enabled ? "Nonaktifkan" : "Aktifkan"}</button>
    </div>
    {notice && <div role="status" className="fixed bottom-4 left-4 right-4 z-[70] flex max-w-sm items-start justify-between gap-3 border border-amber bg-panel-hi p-4 text-xs leading-5 text-ink-hi shadow-2xl sm:bottom-6 sm:left-auto sm:right-6"><span>{notice}</span><button type="button" onClick={() => setNotice(null)} className="min-h-8 shrink-0 px-2 font-bold text-amber hover:underline" aria-label="Tutup pemberitahuan extension">Tutup</button></div>}
  </section>;
}
