"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

function subscribe(callback: () => void) {
  window.addEventListener("idx-theme-change", callback);
  window.addEventListener("storage", callback);
  return () => { window.removeEventListener("idx-theme-change", callback); window.removeEventListener("storage", callback); };
}

function getTheme(): Theme { return document.documentElement.dataset.theme === "light" ? "light" : "dark"; }
function setDocumentTheme(next: Theme) {
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem("idx-theme", next); } catch { /* Private browsing may block storage. */ }
  window.dispatchEvent(new Event("idx-theme-change"));
}

export function ThemeControl() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "dark" as Theme);

  function change(next: Theme) {
    setDocumentTheme(next);
  }

  return (
    <fieldset className="mb-6">
      <legend className="mb-2 text-[10px] uppercase tracking-[0.14em] text-dim">Tampilan terminal</legend>
      <div className="grid grid-cols-2 gap-2 sm:max-w-xs">
        {(["dark", "light"] as const).map((option) => {
          const Icon = option === "dark" ? Moon : Sun;
          return (
            <button key={option} type="button" onClick={() => change(option)} aria-pressed={theme === option} className={`flex items-center justify-center gap-2 border px-3 py-2 text-xs font-semibold ${theme === option ? "border-amber bg-amber/10 text-amber" : "border-rule-hi text-ink hover:border-amber"}`}>
              <Icon aria-hidden="true" className="h-4 w-4" /> {option === "dark" ? "Gelap" : "Terang"}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-dim">Pilihan tersimpan di browser ini.</p>
    </fieldset>
  );
}
