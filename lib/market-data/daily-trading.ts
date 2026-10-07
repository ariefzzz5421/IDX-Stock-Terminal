import type { Quote } from "./types";

type OfficialDay = { date: string | null; volume: number | null; value: number | null } | null | undefined;

export type DailyTrading = {
  date: string | null;
  volume: number | null;
  value: number | null;
  source: string;
  estimatedValue: boolean;
};

function jakartaDay(timestamp: number): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(timestamp));
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** Do not present yesterday's exact BEI total as today's running volume. */
export function selectDailyTrading(official: OfficialDay, quote: Quote | null, provider: string): DailyTrading {
  const quoteDate = quote && Number.isFinite(quote.timestamp) ? jakartaDay(quote.timestamp) : null;
  if (official?.date && /^\d{4}-\d{2}-\d{2}$/.test(official.date) && (!quoteDate || official.date >= quoteDate) && (official.volume !== null || official.value !== null)) {
    return { date: official.date, volume: official.volume, value: official.value, source: "BEI · Ringkasan Saham", estimatedValue: false };
  }
  if (quote && provider !== "mock" && quoteDate) {
    const volume = quote.volumeAvailable === false || !Number.isFinite(quote.volume) ? null : quote.volume;
    return {
      date: quoteDate, volume,
      value: volume === null || !Number.isFinite(quote.value) ? null : quote.value,
      source: provider === "yahoo" ? "Yahoo Finance" : provider,
      estimatedValue: provider === "yahoo",
    };
  }
  if (official?.date && /^\d{4}-\d{2}-\d{2}$/.test(official.date)) {
    return { date: official.date, volume: official.volume, value: official.value, source: "BEI · Ringkasan Saham", estimatedValue: false };
  }
  return { date: null, volume: null, value: null, source: "Tidak tersedia", estimatedValue: false };
}
