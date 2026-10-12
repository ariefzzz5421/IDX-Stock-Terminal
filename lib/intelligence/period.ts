export function parseResearchPeriod(value: string | undefined) {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) return null;
  const [year, month] = value.split("-").map(Number);
  if (!Number.isInteger(year) || year < 1990 || year > 2200) return null;
  // Published timestamps are grouped in Jakarta time throughout the analyst UI.
  const start = new Date(Date.UTC(year, month - 1, 1) - 7 * 60 * 60 * 1000);
  const end = new Date(Date.UTC(year, month, 1) - 7 * 60 * 60 * 1000);
  return { start, end };
}

export function periodOptions(oldest: Date | null, newest: Date | null) {
  if (!oldest || !newest) return [] as string[];
  const start = new Date(oldest.getTime() + 7 * 60 * 60 * 1000);
  const end = new Date(newest.getTime() + 7 * 60 * 60 * 1000);
  let year = end.getUTCFullYear();
  let month = end.getUTCMonth();
  const firstYear = start.getUTCFullYear();
  const firstMonth = start.getUTCMonth();
  const periods: string[] = [];
  while ((year > firstYear || (year === firstYear && month >= firstMonth)) && periods.length < 120) {
    periods.push(`${year}-${String(month + 1).padStart(2, "0")}`);
    month -= 1;
    if (month < 0) { month = 11; year -= 1; }
  }
  return periods;
}

export function formatResearchPeriod(value: string) {
  const parsed = parseResearchPeriod(value);
  if (!parsed) return "Semua periode";
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", month: "long", year: "numeric" })
    .format(new Date(Date.UTC(year, month - 1, 15, 12)));
}
