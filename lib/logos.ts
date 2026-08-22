import overrides from "@/data/logo-overrides.json";
import { getCompanyLogoUrl } from "@/lib/company-catalog";

/**
 * Hosts whose images go through next/image. Anything else still renders, just
 * unoptimised — so a URL you paste into data/logo-overrides.json works without
 * anyone having to remember to edit next.config.ts too.
 */
const OPTIMISED_HOSTS = [
  "https://s3-symbol-logo.tradingview.com/",
  "https://storage.invezgo.com/icon/",
];

/** Keys starting with `_` are notes to the reader, not tickers. */
const MANUAL_LOGOS: Record<string, string> = Object.fromEntries(
  Object.entries(overrides as Record<string, string>).filter(
    ([key, value]) => !key.startsWith("_") && typeof value === "string" && value,
  ),
);

export type ResolvedLogo = {
  url: string;
  /** Local files and known hosts can be optimised; arbitrary URLs cannot. */
  optimised: boolean;
  source: "manual" | "catalog";
};

/**
 * Resolve the logo for a ticker.
 *
 * data/logo-overrides.json wins over the bundled catalogue: it is the file a
 * human edits on purpose, so it must beat whatever was scraped.
 */
export function resolveLogo(
  code: string,
  fallbackUrl?: string | null,
): ResolvedLogo | null {
  const ticker = code.toUpperCase();

  const manual = MANUAL_LOGOS[ticker];
  if (manual) {
    return {
      url: manual,
      optimised:
        manual.startsWith("/") ||
        OPTIMISED_HOSTS.some((host) => manual.startsWith(host)),
      source: "manual",
    };
  }

  const catalog = getCompanyLogoUrl(ticker) ?? fallbackUrl ?? null;
  if (!catalog) return null;

  return {
    url: catalog,
    optimised:
      catalog.startsWith("/") ||
      OPTIMISED_HOSTS.some((host) => catalog.startsWith(host)),
    source: "catalog",
  };
}

export function hasManualLogo(code: string): boolean {
  return Boolean(MANUAL_LOGOS[code.toUpperCase()]);
}

export function manualLogoCount(): number {
  return Object.keys(MANUAL_LOGOS).length;
}
