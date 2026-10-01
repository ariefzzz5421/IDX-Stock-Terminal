"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

type StockOption = { code: string; name: string };

export function CommandBar({ stocks }: { stocks: StockOption[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [error, setError] = useState("");
  const matches = useMemo(() => {
    const needle = value.trim().toLocaleUpperCase("id-ID");
    if (!needle) return [];
    return stocks
      .filter((stock) => stock.code.includes(needle) || stock.name.toLocaleUpperCase("id-ID").includes(needle))
      .sort((a, b) => Number(b.code.startsWith(needle)) - Number(a.code.startsWith(needle)) || a.code.localeCompare(b.code))
      .slice(0, 8);
  }, [stocks, value]);

  useEffect(() => {
    function focusSearch(event: globalThis.KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (event.key === "/" && !(target instanceof HTMLInputElement) && !(target instanceof HTMLTextAreaElement)) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  function go(code: string) {
    setValue("");
    setOpen(false);
    setError("");
    router.push(`/asset/${code}`);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (matches[active]) go(matches[active].code);
    else if (value.trim()) setError("Saham tidak ditemukan");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && matches.length) {
      event.preventDefault(); setOpen(true); setActive((index) => (index + 1) % matches.length);
    } else if (event.key === "ArrowUp" && matches.length) {
      event.preventDefault(); setOpen(true); setActive((index) => (index - 1 + matches.length) % matches.length);
    } else if (event.key === "Escape") setOpen(false);
  }

  return (
    <form onSubmit={submit} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} className="relative flex min-w-0 flex-1 items-center gap-2 border-x border-rule px-3">
      <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-amber" />
      <input
        ref={inputRef}
        value={value}
        onChange={(event) => { setValue(event.target.value); setOpen(true); setActive(0); setError(""); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        role="combobox"
        aria-label="Cari saham berdasarkan kode atau nama"
        aria-expanded={open && matches.length > 0}
        aria-controls="ticker-suggestions"
        aria-activedescendant={open && matches.length ? `ticker-option-${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        className="min-w-0 flex-1 bg-transparent py-3 text-sm text-ink-hi outline-none"
      />
      {error && <span role="status" className="shrink-0 text-micro text-down">{error}</span>}
      {open && value.trim() && (
        <div id="ticker-suggestions" role="listbox" aria-label="Hasil pencarian saham" className="absolute inset-x-0 top-full z-[100] max-h-80 overflow-y-auto border border-rule-hi bg-panel shadow-xl">
          {matches.length ? matches.map((stock, index) => (
            <button key={stock.code} id={`ticker-option-${index}`} role="option" aria-selected={index === active} type="button" onMouseEnter={() => setActive(index)} onClick={() => go(stock.code)} className={`flex w-full min-w-0 items-center gap-3 border-b border-rule px-3 py-2 text-left text-xs hover:bg-panel-hi ${index === active ? "bg-panel-hi text-amber" : "text-ink"}`}>
              <strong className="w-12 shrink-0 text-amber">{stock.code}</strong><span className="min-w-0 truncate">{stock.name}</span>
            </button>
          )) : <p className="px-3 py-2 text-xs text-dim">Tidak ada saham yang cocok.</p>}
        </div>
      )}
    </form>
  );
}
