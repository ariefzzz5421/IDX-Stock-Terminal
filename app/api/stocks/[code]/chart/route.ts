import { getViewer } from "@/lib/auth/session";
import { getCompanyCatalogEntry } from "@/lib/company-catalog";
import { isChartRange } from "@/lib/chart-ranges";
import { getYahooRangeOHLCV } from "@/lib/market-data/yahoo";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: RouteContext<"/api/stocks/[code]/chart">) {
  if (!await getViewer()) return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  const { code: raw } = await params;
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z0-9]{3,6}$/.test(code) || !getCompanyCatalogEntry(code)) {
    return Response.json({ error: "Saham tidak ditemukan." }, { status: 404 });
  }
  const range = new URL(request.url).searchParams.get("range") ?? "1D";
  if (!isChartRange(range)) return Response.json({ error: "Rentang tidak dikenal." }, { status: 400 });
  try {
    const candles = await getYahooRangeOHLCV(code, range);
    return Response.json({ candles, range, source: "Yahoo Finance", delayed: true }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch (error) {
    console.error(`[stock chart] ${code} ${range}:`, error);
    return Response.json({ error: "Riwayat harga dari Yahoo Finance sedang tidak tersedia." }, { status: 503 });
  }
}
