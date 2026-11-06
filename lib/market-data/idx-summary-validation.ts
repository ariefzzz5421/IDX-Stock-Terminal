/**
 * BEI Ringkasan Saham is an end-of-day reference, not an intraday quote feed.
 * Reject a truncated / wrong-date response instead of relabeling it as current.
 * This stays pure so tests do not need network access or Next.js server runtime.
 */
export type DatedIdxSummaryRow = {
  code: string;
  date: string;
  volume: number | null;
  value: number | null;
};

export function verifiedDailySummaryRows<T extends DatedIdxSummaryRow>(
  rows: T[],
  requestedDate: string,
  minimumRows = 700,
): T[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate) || !Array.isArray(rows)) return [];
  const unique = new Set<string>();
  const valid = rows.filter((row) => {
    if (!/^[A-Z0-9]{4,6}$/.test(row.code) || unique.has(row.code)) return false;
    if (row.date.slice(0, 10) !== requestedDate) return false;
    if (row.volume === null || !Number.isFinite(row.volume) || row.volume < 0) return false;
    if (row.value === null || !Number.isFinite(row.value) || row.value < 0) return false;
    unique.add(row.code);
    return true;
  });
  // Failing closed is important: BEI sometimes responds with partial, stale,
  // or blocked data and this function must not misrepresent it as a full EOD.
  if (valid.length < minimumRows || valid.length < rows.length * 0.95) return [];
  return valid;
}
