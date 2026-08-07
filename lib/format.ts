const INT = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** IDX prices are whole rupiah. */
export function formatPrice(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return INT.format(Math.round(value));
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatChange(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${INT.format(Math.round(value))}`;
}

/** Compact share counts: 1.2B / 42.1M / 8.4K. */
export function formatVolume(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return INT.format(Math.round(value));
}

/** Rupiah turnover, which routinely runs into trillions. */
export function formatValue(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `Rp ${(value / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `Rp ${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `Rp ${(value / 1e6).toFixed(1)}M`;
  return `Rp ${INT.format(Math.round(value))}`;
}

/** Tailwind class for a price direction. Green up, red down, grey flat. */
export function directionClass(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value) || value === 0) return "text-dim";
  return value > 0 ? "text-up" : "text-down";
}

const JAKARTA_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Jakarta",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatJakartaTime(date: Date | number): string {
  return JAKARTA_TIME.format(new Date(date));
}
