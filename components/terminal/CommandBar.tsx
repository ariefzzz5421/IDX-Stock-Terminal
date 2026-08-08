"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

/**
 * Bloomberg conceit: type a ticker, press GO, land on its page. Focus with `/`
 * from anywhere in the terminal.
 */
export function CommandBar({ knownCodes }: { knownCodes: string[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typingElsewhere =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement;

      if (event.key === "/" && !typingElsewhere) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const code = value.trim().toUpperCase();
    if (!code) return;

    if (!knownCodes.includes(code)) {
      setError(`No ticker ${code}`);
      setTimeout(() => setError(null), 2600);
      return;
    }

    setValue("");
    setError(null);
    router.push(`/stock/${code}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-w-0 flex-1 items-center gap-2 border-x border-rule px-3"
    >
      <span className="shrink-0 font-display text-sm font-bold tracking-[0.1em] text-amber">
        IDX&gt;
      </span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="TYPE A TICKER, PRESS ENTER"
        aria-label="Command bar: type a ticker and press Enter"
        autoComplete="off"
        spellCheck={false}
        className="min-w-0 flex-1 bg-transparent py-3 text-sm uppercase tracking-[0.14em] text-ink-hi outline-none placeholder:tracking-[0.1em] placeholder:text-dimmer"
      />
      {error ? (
        <span className="shrink-0 text-micro uppercase tracking-[0.1em] text-down">
          {error}
        </span>
      ) : (
        <span className="hidden shrink-0 text-micro uppercase tracking-[0.1em] text-dimmer sm:inline">
          Press / to focus
        </span>
      )}
      <button
        type="submit"
        className="shrink-0 bg-amber px-2.5 py-1.5 font-display text-micro font-bold tracking-[0.12em] text-void transition-colors hover:bg-ink-hi"
      >
        &lt;GO&gt;
      </button>
    </form>
  );
}
