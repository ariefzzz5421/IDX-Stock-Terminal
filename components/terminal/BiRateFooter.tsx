const SOURCE = "https://www.bi.go.id/id/statistik/indikator/bi-rate.aspx";
const LAST_VERIFIED = { rate: 5.75, date: "23 September 2026", fallback: true };

async function getBiRate() {
  try {
    const response = await fetch(SOURCE, { next: { revalidate: 21_600 }, signal: AbortSignal.timeout(6_000) });
    if (!response.ok) return LAST_VERIFIED;
    const html = await response.text();
    const firstRow = html.match(/<tbody[^>]*>[\s\S]*?<tr[^>]*>[\s\S]*?<\/tr>/i)?.[0];
    const cells = [...(firstRow?.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi) ?? [])]
      .map((match) => match[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim());
    const dateIndex = cells.findIndex((cell) => /\b\d{4}\b/.test(cell));
    const date = cells[dateIndex];
    const rate = Number(cells[dateIndex + 1]?.match(/\d+(?:[.,]\d+)?/)?.[0]?.replace(",", "."));
    if (!date || !/\d{4}/.test(date) || !Number.isFinite(rate) || rate < 0 || rate > 20) return LAST_VERIFIED;
    return { rate, date, fallback: false };
  } catch { return LAST_VERIFIED; }
}

export async function BiRateFooter() {
  const { rate, date, fallback } = await getBiRate();
  return <a href={SOURCE} target="_blank" rel="noopener noreferrer" title={`${fallback ? "Snapshot terverifikasi" : "Publikasi terbaru"} Bank Indonesia · ${date}`} className="min-w-0 text-dim hover:text-cyan">
    BI-Rate <span className="text-ink">{rate.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span> <span className="text-dimmer">· {date}</span>
  </a>;
}
