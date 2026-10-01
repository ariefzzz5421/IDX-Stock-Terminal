export function formatWealth(usd?: number) {
  return usd === undefined ? "N/D" : `US$${(usd / 1e9).toLocaleString("id-ID", { maximumFractionDigits: 2 })} miliar`;
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
