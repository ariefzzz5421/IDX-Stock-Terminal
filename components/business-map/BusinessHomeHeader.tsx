import Link from "next/link";
import { ArrowUpRight, MapPinned } from "lucide-react";
import { BUSINESS_LOCATIONS } from "@/data/business-locations";
import { COAL_GROUP_PRODUCTION } from "@/data/business-locations/coal-groups";
import { formatMetric } from "@/lib/business-locations";
import { BusinessHomeCompanies, type HomeCompany } from "./BusinessHomeCompanies";
import { MARKET_CAP_AS_OF } from "@/data/business-locations/market-caps";
import { MarketVolumeTape } from "@/components/terminal/MarketVolumeTape";
import type { TrendingStock } from "@/lib/market-data/trending";

const groups = new Set(BUSINESS_LOCATIONS.map((item) => item.ticker ?? item.company));
const disclosed = new Set(BUSINESS_LOCATIONS.filter((item) => item.sector === "coal" && item.ticker && COAL_GROUP_PRODUCTION[item.ticker]).map((item) => item.ticker!));
const coalMt = [...disclosed].reduce((sum, ticker) => sum + COAL_GROUP_PRODUCTION[ticker].mt, 0);
const facilities = BUSINESS_LOCATIONS.filter((item) => item.sector === "data-center" && !item.pipelineCategory && item.dataCenter?.disclosedCapacityMw !== undefined);
const facilityMw = facilities.reduce((sum, item) => sum + item.dataCenter!.disclosedCapacityMw!, 0);
const companyGroups = new Map<string, HomeCompany>();
for (const item of BUSINESS_LOCATIONS) {
  const key = item.ticker ?? item.company;
  if (!companyGroups.has(key)) companyGroups.set(key, { key, name: item.sector === "coal" ? item.listedCompany ?? item.company : item.company, operator: item.company, ticker: item.ticker, exposure: item.sector === "data-center" && Boolean(item.ticker && item.ticker !== "DCII") });
}

export function BusinessHomeHeader({ preview = false, volumeLeaders }: { preview?: boolean; volumeLeaders?: TrendingStock[] }) {
  return <section aria-label="Ringkasan Lokasi Bisnis" className="border-b border-rule bg-panel">
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber"><MapPinned aria-hidden="true" className="h-3.5 w-3.5" /> Lokasi Bisnis <span className="hidden font-normal normal-case tracking-normal text-dim sm:inline">/ peta aset usaha Indonesia</span></div>
      <div className="flex items-center gap-3"><span className="hidden text-micro text-dim md:inline">Kap. pasar: snapshot TradingView {MARKET_CAP_AS_OF}</span><Link href={preview ? "/preview/lokasi-bisnis" : "/lokasi-bisnis"} className="inline-flex items-center gap-1 text-xs text-cyan hover:underline">Buka peta <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /></Link></div>
    </div>
    <div className="grid grid-cols-2 gap-px bg-rule lg:grid-cols-4">
      <HeaderMetric label="Cakupan" value={`${groups.size} grup/operator`} note="Batu bara + pusat data" />
      <HeaderMetric label="Lokasi" value={String(BUSINESS_LOCATIONS.length)} note="Titik peta perkiraan" />
      <HeaderMetric label="Produksi 2025 · terungkap" value={formatMetric(coalMt, "Mt")} note={`${disclosed.size} dari 10 grup batu bara`} />
      <HeaderMetric label="Kapasitas fasilitas · terungkap" value={`≥${formatMetric(facilityMw, "MW")}`} note={`${facilities.length} fasilitas · bukan beban aktif`} />
    </div>
    {volumeLeaders ? <MarketVolumeTape stocks={volumeLeaders} /> : <BusinessHomeCompanies items={[...companyGroups.values()]} preview={preview} />}
  </section>;
}

function HeaderMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return <div className="min-w-0 bg-panel px-4 py-2.5"><div className="text-micro uppercase tracking-wider text-dim">{label}</div><div className="mt-0.5 truncate font-display text-sm font-bold text-ink-hi">{value}</div><div className="truncate text-micro text-dim" title={note}>{note}</div></div>;
}
