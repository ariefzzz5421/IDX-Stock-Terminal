"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export type FloatSort = "lowest-float" | "largest-float" | "market-cap";

export function FloatFilters({ query, sort }: { query: string; sort: FloatSort }) {
  const router = useRouter();
  const [text, setText] = useState(query);
  const [selectedSort, setSelectedSort] = useState<FloatSort>(sort);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const restoreFromHistory = () => {
      const params = new URLSearchParams(window.location.search);
      setText(params.get("q") ?? "");
      const restoredSort = params.get("sort");
      setSelectedSort(restoredSort === "largest-float" || restoredSort === "market-cap" ? restoredSort : "lowest-float");
    };
    window.addEventListener("popstate", restoreFromHistory);
    return () => { window.removeEventListener("popstate", restoreFromHistory); if (timer.current) clearTimeout(timer.current); };
  }, []);

  function navigate(nextQuery: string, nextSort: FloatSort) {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim().slice(0, 40));
    params.set("sort", nextSort);
    startTransition(() => router.replace(`/free-float?${params.toString()}`, { scroll: false }));
  }

  return <div className="flex flex-col gap-2 border-b border-rule px-4 py-3 sm:flex-row sm:items-center sm:px-6">
    <label className="flex min-w-0 flex-1 items-center gap-2 border border-rule-hi bg-void px-3 focus-within:border-amber">
      <Search className="h-4 w-4 shrink-0 text-amber" aria-hidden="true" />
      <input type="search" value={text} maxLength={40} placeholder="Cari emiten atau kode" aria-label="Cari emiten atau kode" className="min-h-11 min-w-0 flex-1 bg-transparent text-xs text-ink-hi outline-none placeholder:text-dim"
        onChange={(event) => {
          const value = event.target.value;
          setText(value);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => navigate(value, selectedSort), 350);
        }}
        onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); if (timer.current) clearTimeout(timer.current); navigate(text, selectedSort); } }} />
    </label>
    <select value={selectedSort} aria-label="Filter urutan free float" className="min-h-11 min-w-0 border border-rule-hi bg-void px-3 text-xs text-ink-hi sm:w-48"
      onChange={(event) => {
        const nextSort = event.target.value as FloatSort;
        setSelectedSort(nextSort);
        if (timer.current) clearTimeout(timer.current);
        navigate(text, nextSort);
      }}>
      <option value="lowest-float">Float Terkecil</option>
      <option value="largest-float">Float Terbesar</option>
      <option value="market-cap">Market cap terbesar</option>
    </select>
    <span aria-live="polite" className="text-micro text-dim sm:w-16">{pending ? "Memuat…" : ""}</span>
  </div>;
}
