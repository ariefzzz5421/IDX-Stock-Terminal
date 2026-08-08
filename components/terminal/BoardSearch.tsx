"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function BoardSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    // Dropping `page` is deliberate: a new search starts at the first page.
    router.push(trimmed ? `/market?q=${encodeURIComponent(trimmed)}` : "/market");
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter by ticker or company name…"
        aria-label="Filter the board"
        spellCheck={false}
        className="min-w-0 flex-1 border border-rule-hi bg-void px-3 py-2 text-sm text-ink-hi outline-none placeholder:text-dimmer focus:border-amber"
      />
      <button
        type="submit"
        className="shrink-0 bg-amber px-3 py-2 text-micro font-bold uppercase tracking-[0.12em] text-void transition-colors hover:bg-ink-hi"
      >
        Filter
      </button>
      {initialQuery && (
        <button
          type="button"
          onClick={() => {
            setQuery("");
            router.push("/market");
          }}
          className="shrink-0 border border-rule-hi px-3 py-2 text-micro uppercase tracking-[0.12em] text-dim transition-colors hover:border-down hover:text-down"
        >
          Clear
        </button>
      )}
    </form>
  );
}
