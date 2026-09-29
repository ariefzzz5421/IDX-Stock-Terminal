import Link from "next/link";
import type { BusinessLocation } from "@/lib/business-locations";
import { formatMetric, STATUS_LABEL } from "@/lib/business-locations";
import { COAL_GROUP_PRODUCTION } from "@/data/business-locations/coal-groups";

function Field({ label, value }: { label: string; value?: string | number }) {
  return <div className="flex items-start justify-between gap-3 border-b border-rule py-2 text-xs"><dt className="text-dim">{label}</dt><dd className="max-w-[58%] text-right text-ink-hi">{value ?? "N/D"}</dd></div>;
}

export function BusinessDetail({ item }: { item: BusinessLocation }) {
  const dc = item.dataCenter;
  const groupProduction = item.ticker ? COAL_GROUP_PRODUCTION[item.ticker] : undefined;
  return <div className="space-y-4 p-4 text-xs">
    <div><div className="flex items-center gap-2 text-micro uppercase tracking-widest text-amber"><span>{item.ticker ?? item.sector}</span><span className="text-dimmer">/</span><span>{STATUS_LABEL[item.status]}</span></div><h2 className="mt-1 font-display text-lg font-bold text-ink-hi">{item.assetName}</h2><p className="mt-1 text-dim">{item.company}{item.subsidiary ? ` · ${item.subsidiary}` : ""}</p><p className="mt-1 text-dim">{item.regency ? `${item.regency}, ` : ""}{item.province}</p></div>
    <p className="border-l-2 border-amber/70 pl-3 leading-relaxed text-ink">{item.description}</p>
    <div className="border border-rule-hi bg-panel-hi px-3 py-2 text-dim">{item.coordinatePrecision === "approximate" ? "Lokasi perkiraan berdasarkan kabupaten/kota atau kawasan; bukan koordinat fasilitas yang disurvei." : "Koordinat fasilitas terverifikasi."}</div>
    <dl>{item.sector === "coal" ? <>
      <Field label="Production 2025" value={formatMetric(item.coal?.production2025Mt, "Mt")} />
      {groupProduction && <div className="border-b border-rule py-2 text-xs"><span className="text-dim">Group production 2025</span><a href={groupProduction.source.url} target="_blank" rel="noopener noreferrer" className="float-right text-cyan hover:underline" title={groupProduction.source.name}>{formatMetric(groupProduction.mt, "Mt")} ↗</a><p className="clear-both pt-1 text-micro text-dim">Consolidated group figure; not this mine alone.</p></div>}
      <Field label="RKAB 2026" value={item.coal?.rkab2026Mt === undefined ? "N/D — belum tersedia secara publik" : formatMetric(item.coal.rkab2026Mt, "Mt")} />
      <Field label="Reserves" value={formatMetric(item.coal?.reservesMt, "Mt")} />
      <Field label="Coal type" value={item.coal?.coalType} />
      <Field label="Mining area" value={formatMetric(item.coal?.areaHa, "ha")} />
    </> : <>
      <Field label="Operational IT load" value={formatMetric(dc?.operationalItLoadMw, "MW")} />
      <Field label="Disclosed facility capacity" value={formatMetric(dc?.disclosedCapacityMw, "MW")} />
      <Field label="Planned / full build" value={formatMetric(dc?.plannedItLoadMw, "MW")} />
      <Field label="Rack count" value={formatMetric(dc?.racks)} />
      <Field label="PUE" value={formatMetric(dc?.pue)} />
      <Field label="Power source" value={dc?.powerSource} />
      <Field label="AI-ready" value={dc?.aiReady === undefined ? undefined : dc.aiReady ? "Yes (operator claim)" : "No"} />
      <Field label="Certification" value={dc?.certification} />
    </>}</dl>
    {dc?.capacityBasis && <p className="text-dim">Capacity basis: {dc.capacityBasis}</p>}
    {item.pipelineCategory && <p className="border border-amber/50 bg-amber/10 p-2 text-amber">AI Infrastructure Pipeline · future planned capacity ≠ live operational capacity</p>}
    <section><h3 className="mb-1 text-micro font-bold uppercase tracking-widest text-amber">Business model</h3><p className="leading-relaxed text-ink">{item.businessModel}</p></section>
    {item.customerTypes?.length ? <section><h3 className="mb-1 text-micro font-bold uppercase tracking-widest text-amber">Customer categories</h3><p>{item.customerTypes.join(" · ")}</p></section> : null}
    {item.infrastructure?.length ? <section><h3 className="mb-1 text-micro font-bold uppercase tracking-widest text-amber">Infrastructure</h3><p>{item.infrastructure.join(" · ")}</p></section> : null}
    {item.investorRelevance && <section><h3 className="mb-1 text-micro font-bold uppercase tracking-widest text-amber">Investor relevance</h3><p className="leading-relaxed">{item.investorRelevance}</p></section>}
    <section><h3 className="mb-2 text-micro font-bold uppercase tracking-widest text-amber">Sources</h3>{item.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="mb-2 block break-words text-cyan hover:underline">{source.name} ↗<span className="block text-dim">Verified {source.verified}</span></a>)}</section>
    {item.ticker && <Link href={`/stock/${item.ticker}`} className="inline-block border border-cyan px-3 py-2 text-cyan hover:bg-cyan/10">Open stock {item.ticker} →</Link>}
  </div>;
}
