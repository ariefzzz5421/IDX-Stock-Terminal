"use client";

import { Moon } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

function subscribe(callback: () => void) {
  window.addEventListener("idx-theme-change", callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener("idx-theme-change", callback); window.removeEventListener("storage", callback); };
}

function getTheme(): Theme { return document.documentElement.dataset.theme === "light" ? "light" : "dark"; }

export function ThemeControl({ label = "Mode Gelap" }: { label?: string }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as Theme);
  return <button type="button" role="switch" aria-checked={theme === "dark"} aria-label={label}
    onClick={() => {
      const next = theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      document.documentElement.style.colorScheme = next;
      try { localStorage.setItem("idx-theme", next); } catch { /* Private browsing may block storage. */ }
      window.dispatchEvent(new Event("idx-theme-change"));
    }} className="flex min-h-14 w-full items-center gap-3 px-4 text-left transition-colors hover:bg-panel-hi">
    <Moon className="h-5 w-5 text-dim" aria-hidden="true" /><span className="flex-1 text-sm text-ink-hi">{label}</span>
    <span aria-hidden="true" className={`relative h-6 w-11 rounded-full border transition-colors ${theme === "dark" ? "border-amber bg-amber" : "border-rule-hi bg-rule-hi"}`}>
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-void transition-transform ${theme === "dark" ? "translate-x-5" : "translate-x-0.5"}`} />
    </span>
  </button>;
}
