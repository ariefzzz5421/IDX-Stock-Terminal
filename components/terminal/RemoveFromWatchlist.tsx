"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function RemoveFromWatchlist({ code }: { code: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  async function remove() {
    setBusy(true);
    await fetch(`/api/watchlist?code=${encodeURIComponent(code)}`, {
      method: "DELETE",
    });
    setBusy(false);
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={busy}
      aria-label={`Remove ${code} from watchlist`}
      className="px-2 py-1 text-dimmer opacity-0 transition-opacity hover:text-down focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-40"
    >
      ×
    </button>
  );
}
