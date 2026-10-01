import { getViewer } from "@/lib/auth/session";
import { createMarketBrief, getAnalystProvider } from "@/lib/ai-analyst";
import { getMarketActivity } from "@/lib/market-data/trending";

export async function POST() {
  if (!await getViewer()) return Response.json({ error: "Login required" }, { status: 401 });
  const brief = createMarketBrief(await getMarketActivity());
  const provider = getAnalystProvider();
  if (!provider || !brief.asOf) return Response.json({ brief, aiSummary: null, providerConfigured: Boolean(provider) }, { headers: { "Cache-Control": "no-store" } });

  try {
    const aiSummary = await provider.summarize(brief);
    return Response.json({ brief, aiSummary, providerConfigured: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[ai-analyst] provider unavailable", error);
    return Response.json({ brief, aiSummary: null, providerConfigured: true, providerError: true }, { headers: { "Cache-Control": "no-store" } });
  }
}
