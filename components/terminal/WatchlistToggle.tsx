"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
      className={`shrink-0 border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] transition-colors disabled:opacity-50 ${
        watched
          ? "border-amber-dim text-amber hover:border-down hover:text-down"
          : "border-rule-hi text-dim hover:border-amber hover:text-amber"
      }`}
    >
      {watched ? "− Watchlist" : "+ Watchlist"}
    </button>
  );
}
