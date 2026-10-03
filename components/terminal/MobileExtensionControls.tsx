"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChartNoAxesCombined, Star } from "lucide-react";
import { setMobileExtensionEnabled, VOLUME_EXTENSION_COOKIE, WATCHLIST_EXTENSION_COOKIE } from "@/lib/mobile-extensions";

function Toggle({ title, detail, icon: Icon, cookieName, initialEnabled }: { title: string; detail: string; icon: typeof Star; cookieName: string; initialEnabled: boolean }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setMobileExtensionEnabled(cookieName, next);
    setNotice(`${title} ${next ? "aktif. Buka melalui tombol di tepi kanan ponsel." : "dinonaktifkan."}`);
    startTransition(() => router.refresh());
  }
  return <section className="border border-rule-hi bg-panel p-4 sm:p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center border border-amber/50 bg-amber/10 text-amber"><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><h2 className="font-display text-base font-bold text-ink-hi">{title}</h2><p className="mt-1 text-xs leading-5 text-dim">{detail}</p></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className={`border px-2 py-1 text-micro font-bold uppercase ${enabled ? "border-up/50 text-up" : "border-rule-hi text-dim"}`}>{enabled ? "Aktif" : "Nonaktif"}</span><button type="button" role="switch" aria-checked={enabled} aria-label={`Tampilkan ${title}`} onClick={toggle} disabled={pending} className={`min-h-11 border px-4 text-xs font-bold uppercase disabled:opacity-50 ${enabled ? "border-rule-hi text-ink-hi" : "border-amber bg-amber text-void"}`}>{enabled ? "Nonaktifkan" : "Aktifkan"}</button></div>{notice && <p role="status" className="mt-3 text-xs text-cyan">{notice}</p>}</section>;
}

export function MobileExtensionControls({ watchlist, volume }: { watchlist: boolean; volume: boolean }) {
  return <div className="mt-4 grid gap-4 sm:grid-cols-2"><Toggle title="Pantauan ponsel" detail="Panel saham pantauan dengan tombol bintang di tepi kanan. Tetap tersedia sampai dinonaktifkan di sini." icon={Star} cookieName={WATCHLIST_EXTENSION_COOKIE} initialEnabled={watchlist} /><Toggle title="Volume sesi terakhir" detail="Peringkat volume lembar saham dari sesi pasar terbaru, dengan tautan ticker yang sesuai." icon={ChartNoAxesCombined} cookieName={VOLUME_EXTENSION_COOKIE} initialEnabled={volume} /></div>;
}
