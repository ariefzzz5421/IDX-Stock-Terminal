"use client";

import { useSyncExternalStore } from "react";

export type ProfileLanguage = "id" | "en";

function subscribe(callback: () => void) {
  window.addEventListener("idx-language-change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("idx-language-change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getLanguage(): ProfileLanguage {
  try { return localStorage.getItem("idx-language") === "en" ? "en" : "id"; }
  catch { return "id"; }
}

export function useProfileLanguage() {
  return useSyncExternalStore(subscribe, getLanguage, () => "id" as ProfileLanguage);
}

export function LanguageControl() {
  const language = useProfileLanguage();
  return (
    <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
      {([ { code: "id", flag: "🇮🇩", label: "Bahasa Indonesia" }, { code: "en", flag: "🇬🇧", label: "Bahasa Inggris" } ] as const).map((option) => (
        <button key={option.code} type="button" onClick={() => {
          localStorage.setItem("idx-language", option.code);
          document.documentElement.lang = option.code;
          window.dispatchEvent(new Event("idx-language-change"));
        }} aria-pressed={language === option.code}
          className={`flex min-h-12 items-center gap-3 border px-3 text-left text-sm transition-colors ${language === option.code ? "border-amber bg-amber/10 text-ink-hi" : "border-rule-hi text-ink hover:border-amber"}`}>
          <span className="text-lg" aria-hidden="true">{option.flag}</span><span>{option.label}</span><span className="ml-auto text-amber">{language === option.code ? "✓" : ""}</span>
        </button>
      ))}
    </div>
  );
}
