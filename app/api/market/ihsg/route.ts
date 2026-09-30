import { getIhsgQuote } from "@/lib/market-data/ihsg";

export async function GET() {
  const quote = await getIhsgQuote();
  return Response.json(quote ?? { error: "IHSG quote unavailable" }, {
    status: quote ? 200 : 503,
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=30" },
  });
}
