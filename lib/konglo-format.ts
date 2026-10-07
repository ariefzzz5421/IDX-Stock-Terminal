/** Bank Indonesia JISDOR, 6 October 2026. A dated reference, not a live FX quote. */
export const WEALTH_USD_IDR_RATE = 17_910;
export const WEALTH_FX_DATE = "6 Okt 2026";
export const WEALTH_FX_SOURCE = "https://www.bi.go.id/id/statistik/informasi-kurs/jisdor/Default.aspx";

export function formatWealth(usd?: number) {
  return usd === undefined ? "N/D" : `US$${(usd / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 })}B`;
}

export function formatWealthRupiahEstimate(usd?: number) {
  if (usd === undefined) return "N/D";
  return `EST Rp ${((usd * WEALTH_USD_IDR_RATE) / 1e12).toLocaleString("id-ID", { maximumFractionDigits: 1 })}T`;
}

export function formatRupiahCompact(value: number | null) {
  if (value === null) return "N/D";
  if (value >= 1e12) return `Rp ${(value / 1e12).toLocaleString("id-ID", { maximumFractionDigits: 2 })} T`;
  if (value >= 1e9) return `Rp ${(value / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M`;
  return `Rp ${value.toLocaleString("id-ID")}`;
}

export function formatShares(value: number) {
  return value.toLocaleString("id-ID");
}
