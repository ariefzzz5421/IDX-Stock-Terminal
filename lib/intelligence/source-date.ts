export function parseKseiDate(value: string): Date | null {
  const months: Record<string, number> = { januari: 0, january: 0, februari: 1, february: 1, maret: 2, march: 2, april: 3, mei: 4, may: 4, juni: 5, june: 5, juli: 6, july: 6, agustus: 7, august: 7, september: 8, oktober: 9, october: 9, november: 10, desember: 11, december: 11 };
  const match = value.trim().match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!match) return null;
  const month = months[match[2].toLowerCase()];
  if (month === undefined) return null;
  const day = Number(match[1]);
  const year = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month, day, 5));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month && parsed.getUTCDate() === day ? parsed : null;
}
