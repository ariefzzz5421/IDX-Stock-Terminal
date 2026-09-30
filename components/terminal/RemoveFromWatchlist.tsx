"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Star } from "lucide-react";

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
      className="relative z-30 inline-flex items-center justify-center border border-amber/50 bg-amber/10 p-1.5 text-amber transition-colors hover:border-down hover:bg-down/10 hover:text-down disabled:opacity-40"
    >
      <Star aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor" />
    </button>
  );
}
