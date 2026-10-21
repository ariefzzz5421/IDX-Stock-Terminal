/** Pure formatting rules shared by the server-side Discord image renderers. */
export type MarketCardKind = "VOLUME" | "ARA" | "ARB" | "GAINERS" | "LOSERS" | "CLOSING" | "MARKET";
const TYPES: Array<[MarketCardKind, RegExp]> = [
  ["CLOSING", /\bCLOSING\b/i],
  ["VOLUME", /\bVOLUME\b/i],
  ["ARA", /\bARA\b/i],
  ["ARB", /\bARB\b/i],
  ["GAINERS", /\bGAINERS\b/i],
  ["LOSERS", /\bLOSERS\b/i],
];

export function marketCardHeading(title: string) {
  const type = TYPES.find(([, pattern]) => pattern.test(title))?.[0] ?? "MARKET";
  const clock = title.match(/\b(\d{2}:\d{2})\s*WIB\b/i)?.[1] ?? null;
  const preview = /\bPREVIEW\b/i.test(title);
  return {
    kind: type,
    heading: type === "MARKET" ? "MARKET SNAPSHOT" : type === "CLOSING" ? "CLOSING SUMMARY" : "TOP 10 " + type,
    clock: clock ? clock + " WIB" : "SNAPSHOT",
    preview,
    accent: type === "ARB" || type === "LOSERS" ? "#ff6577" :
      type === "ARA" || type === "GAINERS" ? "#49e0b4" : "#eec780",
  };
}

export function shortCardText(value: unknown, max = 140): string {
  if (typeof value !== "string") return "N/D";
  const clean = value.replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/@/g, "@\u200b").replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, max) : "N/D";
}

export function corporateActionLabel(category: string): string {
  const known: Record<string,string> = {
    DIVIDEND:"DIVIDEN", RIGHTS_ISSUE:"RIGHTS ISSUE", STOCK_SPLIT:"STOCK SPLIT",
    BUYBACK:"BUYBACK", MERGER_ACQUISITION:"MERGER / AKUISISI",
    PRIVATE_PLACEMENT:"PRIVATE PLACEMENT", TENDER_OFFER:"TENDER OFFER",
    OWNERSHIP:"PERUBAHAN KEPEMILIKAN", SPIN_OFF:"SPIN OFF",
    DIVESTMENT:"DIVESTASI", CAPITAL_INJECTION:"INJEKSI MODAL",
  };
  return known[category] ?? shortCardText(category.replaceAll("_"," "),34).toUpperCase();
}

export function dateWibForCard(date: string | null | undefined): string {
  if (!date) return "N/D";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "N/D";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone:"Asia/Jakarta", day:"numeric", month:"short", year:"numeric",
  }).format(d);
}

export function decimalPct(value:number) {
  return (value >= 0 ? "+" : "") +
    new Intl.NumberFormat("id-ID",{minimumFractionDigits:2,maximumFractionDigits:2}).format(value)+"%";
}