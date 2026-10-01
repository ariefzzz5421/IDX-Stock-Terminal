const INT = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });
const ONE_DECIMAL = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const TWO_DECIMALS = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** IDX prices are whole rupiah. */
export function formatPrice(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return INT.format(Math.round(value));
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${TWO_DECIMALS.format(value)}%`;
}

export function formatChange(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${INT.format(Math.round(value))}`;
}

/** Jumlah lembar saham ringkas, dengan satuan Indonesia. */
export function formatVolume(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${ONE_DECIMAL.format(value / 1e9)} miliar`;
  if (abs >= 1e6) return `${ONE_DECIMAL.format(value / 1e6)} juta`;
  if (abs >= 1e3) return `${ONE_DECIMAL.format(value / 1e3)} ribu`;
  return INT.format(Math.round(value));
}

/** Rupiah turnover, which routinely runs into trillions. */
export function formatValue(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `Rp ${TWO_DECIMALS.format(value / 1e12)} T`;
  if (abs >= 1e9) return `Rp ${ONE_DECIMAL.format(value / 1e9)} miliar`;
  if (abs >= 1e6) return `Rp ${ONE_DECIMAL.format(value / 1e6)} juta`;
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
