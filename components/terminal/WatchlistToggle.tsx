"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Star } from "lucide-react";

export function WatchlistToggle({
  code,
  initiallyWatched,
}: {
  code: string;
  initiallyWatched: boolean;
}) {
  const router = useRouter();
  const [watched, setWatched] = useState(initiallyWatched);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function toggle() {
    setBusy(true);
    const next = !watched;

    const response = next
      ? await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        })
      : await fetch(`/api/watchlist?code=${encodeURIComponent(code)}`, {
          method: "DELETE",
        });

    if (response.ok) {
      setWatched(next);
      startTransition(() => router.refresh());
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={watched ? `Hapus ${code} dari pantauan` : `Tambahkan ${code} ke pantauan`}
      aria-pressed={watched}
      className={`inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors disabled:opacity-50 ${
        watched
          ? "border-amber bg-amber/15 text-amber hover:bg-amber/25"
          : "border-rule-hi bg-panel-hi text-ink-hi hover:border-amber hover:text-amber"
      }`}
    >
      <Star aria-hidden="true" className="h-3.5 w-3.5" fill={watched ? "currentColor" : "none"} />
      Watchlist
    </button>
  );
}
