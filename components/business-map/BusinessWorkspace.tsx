"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { MapPinned, Maximize2, RotateCcw, Search } from "lucide-react";
import type { BusinessLocation, BusinessSector, AssetStatus } from "@/lib/business-locations";
import { formatMetric, SECTORS, STATUS_LABEL } from "@/lib/business-locations";
import { BusinessDetail } from "./BusinessDetail";
import { COAL_GROUP_PRODUCTION } from "@/data/business-locations/coal-groups";

const BusinessMap = dynamic(() => import("./BusinessMap"), { ssr: false, loading: () => <div className="grid h-full place-items-center bg-panel text-sm text-dim">Memuat peta Indonesia… Daftar lokasi tetap tersedia.</div> });

type Props = { locations: BusinessLocation[]; preview?: boolean };
export function BusinessWorkspace({ locations, preview = false }: Props) {
  const [sector, setSector] = useState<BusinessSector | "all">("all");
  const [status, setStatus] = useState<AssetStatus | "all">("all");
  const [province, setProvince] = useState("all");
  const [listedOnly, setListedOnly] = useState(false);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"map" | "ranking">("map");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);
  const [fitVersion, setFitVersion] = useState(0);
  const [resetVersion, setResetVersion] = useState(0);
  const [mapFailed, setMapFailed] = useState(false);

  const provinces = useMemo(() => [...new Set(locations.map((item) => item.province))].sort(), [locations]);
  const filtered = useMemo(() => locations.filter((item) => {
    if (sector !== "all" && item.sector !== sector) return false;
    if (status !== "all" && item.status !== status) return false;
    if (province !== "all" && item.province !== province) return false;
    if (listedOnly && !item.ticker) return false;
    const haystack = [item.ticker, item.listedCompany, item.company, item.subsidiary, item.assetName, item.province, item.regency, item.district].join(" ").toLocaleLowerCase("id-ID");
    return haystack.includes(query.trim().toLocaleLowerCase("id-ID"));
  }), [locations, sector, status, province, listedOnly, query]);
  const selected = filtered.find((item) => item.id === selectedId) ?? null;
  const groups = useMemo(() => {
    const map = new Map<string, BusinessLocation[]>();
    for (const item of filtered) { const key = item.ticker ?? item.company; map.set(key, [...(map.get(key) ?? []), item]); }
    return [...map.entries()].map(([key, assets]) => ({ key, assets, name: assets[0].listedCompany ?? assets[0].company }));
  }, [filtered]);
  const coal = filtered.filter((item) => item.sector === "coal");
  const dc = filtered.filter((item) => item.sector === "data-center" && !item.pipelineCategory);
  const dcDisclosed = dc.filter((item) => item.dataCenter?.disclosedCapacityMw !== undefined);
  const dcPipeline = dc.filter((item) => item.dataCenter?.plannedItLoadMw !== undefined);
  const disclosedCoalGroups = [...new Set(coal.map((item) => item.ticker))].filter((ticker) => ticker && COAL_GROUP_PRODUCTION[ticker]);
  const disclosedCoalMt = disclosedCoalGroups.reduce((sum, ticker) => sum + COAL_GROUP_PRODUCTION[ticker!].mt, 0);
  const visibleSectors = sector === "all" ? "Batubara + Data Center" : SECTORS.find((item) => item.id === sector)?.label;

  const choose = (id: string) => { setSelectedId(id); setSheetOpen(true); setResearchOpen(false); };

  return <main className="business-page min-w-0 bg-void">
    <header className="border-b border-rule bg-panel px-4 py-4 sm:px-5"><div className="flex flex-wrap items-end justify-between gap-2"><div><div className="mb-1 flex items-center gap-2 text-micro uppercase tracking-[0.2em] text-amber"><MapPinned className="h-3.5 w-3.5" /> IDX / Geographic Intelligence</div><h1 className="font-display text-xl font-bold text-ink-hi">Lokasi Bisnis</h1><p className="mt-1 text-xs text-dim">Peta aset, tambang, infrastruktur, dan pusat operasi perusahaan Indonesia</p></div><div className="text-micro text-dim">{preview ? "Preview · market prices demo/static · lokasi bersumber" : "Curated research · updated 29 Sep 2026"}</div></div></header>
    <div className="business-stats grid gap-px border-b border-rule bg-rule"><Stat label="Cakupan" value={`${groups.length} grup/operator`} note={visibleSectors ?? "Semua"} /><Stat label="Lokasi terpetakan" value={String(filtered.length)} note="Semua titik perkiraan" /><Stat label="Batubara · disclosed" value={disclosedCoalGroups.length ? `${formatMetric(disclosedCoalMt, "Mt")}` : "N/D"} note={`${disclosedCoalGroups.length} dari ${new Set(coal.map((item) => item.ticker)).size} grup · produksi 2025`} /><Stat label="Data center · disclosed" value={dcDisclosed.length ? `≥${formatMetric(dcDisclosed.reduce((sum, item) => sum + (item.dataCenter?.disclosedCapacityMw ?? 0), 0), "MW")}` : "N/D"} note={`${dcDisclosed.length} fasilitas · kapasitas, bukan live load`} /></div>
    <div className="business-toolbar flex min-w-0 flex-wrap items-center gap-2 border-b border-rule bg-panel-hi px-3 py-2">
      <div className="relative min-w-[min(100%,18rem)] flex-1"><Search aria-hidden="true" className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Cari lokasi bisnis" placeholder="Cari perusahaan, ticker, tambang, data center, kota..." className="w-full border border-rule-hi bg-panel py-2 pl-8 pr-2 text-xs text-ink outline-none focus:border-amber" /></div>
      <div className="business-chips flex min-w-0 gap-1 overflow-x-auto" aria-label="Sektor"><Chip active={sector === "all"} onClick={() => setSector("all")}>All</Chip>{SECTORS.map((item) => <Chip key={item.id} active={sector === item.id} onClick={() => setSector(item.id)}>{item.marker} {item.label}</Chip>)}</div>
      <select aria-label="Status lokasi" value={status} onChange={(event) => setStatus(event.target.value as AssetStatus | "all")} className="border border-rule-hi bg-panel px-2 py-2 text-xs"><option value="all">Semua status</option>{Object.entries(STATUS_LABEL).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>
      <select aria-label="Provinsi" value={province} onChange={(event) => setProvince(event.target.value)} className="max-w-[10rem] border border-rule-hi bg-panel px-2 py-2 text-xs"><option value="all">Semua provinsi</option>{provinces.map((value) => <option key={value}>{value}</option>)}</select>
      <label className="flex items-center gap-1.5 whitespace-nowrap px-1 text-xs text-dim"><input type="checkbox" checked={listedOnly} onChange={(event) => setListedOnly(event.target.checked)} /> Listed only</label>
      <div className="ml-auto flex gap-px border border-rule-hi"><Chip active={view === "map"} onClick={() => setView("map")}>Map</Chip><Chip active={view === "ranking"} onClick={() => setView("ranking")}>Ranking</Chip></div>
    </div>
    <div className="business-grid min-w-0 gap-px bg-rule">
      <aside className="business-sidebar min-w-0 overflow-auto bg-panel"><div className="border-b border-rule bg-panel-hi px-3 py-2 text-micro font-bold uppercase tracking-widest text-amber">Company / operator <span className="float-right text-dim">{groups.length}</span></div><div className="business-group-list">{groups.map((group) => <div key={group.key} className="border-b border-rule/60"><div className="px-3 pt-2 text-xs font-bold text-cyan">{group.key} <span className="font-normal text-dim">{group.name}</span></div><div className="px-3 pb-1 text-micro text-dim">{group.assets.length} lokasi · {group.assets[0].sector === "coal" ? COAL_GROUP_PRODUCTION[group.key] ? `${formatMetric(COAL_GROUP_PRODUCTION[group.key].mt, "Mt")} grup · 2025` : "produksi N/D" : "operational IT load N/D"}</div>{group.assets.map((item) => <button key={item.id} type="button" onClick={() => choose(item.id)} aria-pressed={selectedId === item.id} className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-panel-hi ${selectedId === item.id ? "border-l-2 border-amber bg-panel-hi text-amber" : "text-ink"}`}>{item.assetName}<span className="block text-micro text-dim">{item.regency ?? item.province} · {STATUS_LABEL[item.status]}</span></button>)}</div>)}</div>{!filtered.length && <p className="p-4 text-xs text-dim">Tidak ada lokasi yang cocok dengan filter.</p>}</aside>
      <section className="business-primary relative min-w-0 bg-panel" aria-label={view === "map" ? "Peta bisnis" : "Ranking bisnis"}>{view === "map" && !mapFailed ? <><div className="absolute left-3 top-3 z-[500] flex gap-1"><button type="button" onClick={() => setResetVersion((n) => n + 1)} className="business-map-action" aria-label="Reset peta Indonesia" title="Reset view"><RotateCcw className="h-4 w-4" /></button><button type="button" onClick={() => setFitVersion((n) => n + 1)} className="business-map-action" aria-label="Tampilkan semua marker tersaring" title="Fit filtered markers"><Maximize2 className="h-4 w-4" /></button></div><BusinessMap locations={filtered} selectedId={selectedId} onSelect={choose} fitVersion={fitVersion} resetVersion={resetVersion} onFailure={() => setMapFailed(true)} /><div className="absolute bottom-2 left-2 z-[500] border border-rule bg-panel/95 px-2 py-1 text-micro text-ink">⛏ Batubara · ▣ Data center · dashed Planned · amber Construction</div></> : <Ranking groups={groups} sector={sector} onSelect={choose} />}{mapFailed && <button onClick={() => { setMapFailed(false); setView("map"); }} className="absolute right-2 top-2 text-cyan">Coba peta lagi</button>}</section>
      <aside className={`business-detail min-w-0 overflow-auto bg-panel ${sheetOpen ? "is-open" : ""}`}><div className="sticky top-0 z-10 flex items-center justify-between border-b border-rule bg-panel-hi px-3 py-2 text-micro font-bold uppercase tracking-widest text-amber"><span>{selected ? "Selected asset" : "Asset detail"}</span><button type="button" onClick={() => setSheetOpen(false)} className="business-sheet-close px-2 py-1 text-dim" aria-label="Tutup detail">Tutup ↓</button></div>{selected ? <><BusinessDetail item={selected} /><div className="border-t border-rule p-4"><button type="button" aria-expanded={researchOpen} onClick={() => setResearchOpen(!researchOpen)} className="w-full border border-amber px-3 py-2 text-xs font-bold text-amber hover:bg-amber/10">AI Research {researchOpen ? "−" : "+"}</button>{researchOpen && <Research item={selected} />}</div></> : <p className="p-4 text-xs leading-relaxed text-dim">Pilih marker di peta atau aset dari daftar untuk melihat profil, metrik, dan sumber.</p>}</aside>
    </div>
    <footer className="grid gap-px border-t border-rule bg-rule text-xs md:grid-cols-3"><div className="bg-panel p-3"><strong className="text-amber">Metodologi</strong><p className="mt-1 text-dim">Titik mewakili kota, kabupaten atau kawasan yang disebut sumber. Bukan batas konsesi maupun koordinat fasilitas presisi.</p></div><div className="bg-panel p-3"><strong className="text-amber">Capacity discipline</strong><p className="mt-1 text-dim">{dcPipeline.length} lokasi dengan pipeline terungkap. Capacity fasilitas, operational IT load, dan target buildout dipisah. N/D tidak dihitung sebagai nol.</p></div><div className="bg-panel p-3"><strong className="text-amber">Sumber & pembaruan</strong><p className="mt-1 text-dim">Sumber per aset tersedia di panel detail. Data kurasi terakhir diverifikasi 29 Sep 2026; pembaruan tidak otomatis.</p></div></footer>
  </main>;
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) { return <div className="min-w-0 bg-panel px-4 py-3"><div className="text-micro uppercase tracking-widest text-dim">{label}</div><div className="mt-1 truncate font-display text-base font-bold text-ink-hi">{value}</div><div className="mt-1 truncate text-micro text-dim" title={note}>{note}</div></div>; }
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} aria-pressed={active} className={`shrink-0 whitespace-nowrap px-2.5 py-2 text-xs ${active ? "bg-amber text-void" : "bg-panel text-dim hover:text-ink"}`}>{children}</button>; }

function Ranking({ groups, sector, onSelect }: { groups: { key: string; name: string; assets: BusinessLocation[] }[]; sector: BusinessSector | "all"; onSelect: (id: string) => void }) {
  const ordered = [...groups].sort((a,b) => {
    if (a.assets[0].sector !== b.assets[0].sector) return a.assets[0].sector === "coal" ? -1 : 1;
    if (a.assets[0].sector === "coal") return (COAL_GROUP_PRODUCTION[b.key]?.mt ?? -1) - (COAL_GROUP_PRODUCTION[a.key]?.mt ?? -1);
    return b.assets.reduce((sum,x) => sum+(x.dataCenter?.disclosedCapacityMw ?? 0),0) - a.assets.reduce((sum,x) => sum+(x.dataCenter?.disclosedCapacityMw ?? 0),0);
  });
  const ranked = ordered.filter((group) => (sector === "all" || group.assets[0].sector === sector) && !group.assets[0].pipelineCategory);
  const pipelineGroups = ordered.filter((group) => (sector === "all" || group.assets[0].sector === sector) && group.assets[0].pipelineCategory);
  return <div className="h-full overflow-auto p-3"><h2 className="font-display text-sm font-bold text-amber">Ranking / tracked coverage</h2><p className="my-2 max-w-3xl text-xs text-dim">Urutan produksi 2025 hanya untuk grup dengan angka terverifikasi; sisanya N/D. Untuk data center, kapasitas fasilitas yang diungkap hanya indikator, bukan operational IT load atau ranking pasar. Pipeline terpisah.</p><div className="overflow-x-auto"><table className="w-full min-w-[46rem] text-left text-xs"><thead className="bg-panel-hi text-micro uppercase text-dim"><tr>{["#","Ticker / Operator","Lokasi utama","Provinsi","Produksi 2025","RKAB 2026","Disclosed facility MW","Pipeline MW"].map((x) => <th key={x} className="px-2 py-2">{x}</th>)}</tr></thead><tbody>{ranked.map((group,index) => { const first=group.assets[0]; const facility=group.assets.reduce((sum,x) => sum+(x.dataCenter?.disclosedCapacityMw ?? 0),0); const pipeline=group.assets.reduce((sum,x) => sum+(x.dataCenter?.plannedItLoadMw ?? 0),0); const sectorRank=ranked.slice(0,index+1).filter((entry) => entry.assets[0].sector === first.sector).length; return <tr key={group.key} className="border-b border-rule hover:bg-panel-hi"><td className="px-2 py-2 text-dim">{sectorRank}</td><td className="px-2 py-2"><button onClick={() => onSelect(first.id)} className="text-left text-cyan hover:underline">{group.key}<span className="block text-dim">{group.name}</span><span className="block text-micro text-amber">{first.sector === "coal" ? "Batubara" : "Data Center"}</span></button></td><td className="px-2 py-2">{first.assetName} <span className="text-dim">+{group.assets.length-1}</span></td><td className="px-2 py-2">{first.province}</td><td className="px-2 py-2">{first.sector === "coal" && COAL_GROUP_PRODUCTION[group.key] ? <a href={COAL_GROUP_PRODUCTION[group.key].source.url} target="_blank" rel="noopener noreferrer" className="text-cyan hover:underline" title={COAL_GROUP_PRODUCTION[group.key].source.name}>{formatMetric(COAL_GROUP_PRODUCTION[group.key].mt,"Mt")} ↗</a> : "N/D"}</td><td className="px-2 py-2">N/D</td><td className="px-2 py-2">{first.sector === "data-center" && facility ? `≥${formatMetric(facility,"MW")}` : "N/D"}</td><td className="px-2 py-2">{pipeline ? formatMetric(pipeline,"MW") : "N/D"}</td></tr>; })}</tbody></table></div>{pipelineGroups.length > 0 && <section className="mt-4 border border-amber/50 bg-amber/10 p-3 text-xs"><h3 className="font-bold text-amber">AI Infrastructure Pipeline · excluded from operational ranking</h3>{pipelineGroups.map((group) => <button key={group.key} type="button" onClick={() => onSelect(group.assets[0].id)} className="mt-2 block text-left text-cyan hover:underline">{group.name} · {group.assets[0].assetName} · live N/D · future target {formatMetric(group.assets[0].dataCenter?.plannedItLoadMw,"MW")} →</button>)}</section>}</div>;
}

function Research({ item }: { item: BusinessLocation }) { return <section className="mt-3 space-y-3 text-xs"><p className="text-dim">AI Research belum dikonfigurasi. Data terverifikasi tetap tersedia; ringkasan berikut disusun deterministik dari sumber aset.</p>{[
  ["Business Summary", item.businessModel], ["Why This Location Matters", `${item.assetName} berada di ${item.regency ?? item.province}, ${item.province}. Titik peta adalah perkiraan wilayah.`],
  ["Capacity / Production", item.sector === "coal" ? `Produksi 2025: ${formatMetric(item.coal?.production2025Mt,"Mt")}; RKAB 2026: ${formatMetric(item.coal?.rkab2026Mt,"Mt")}.` : `Operational IT load: ${formatMetric(item.dataCenter?.operationalItLoadMw,"MW")}; disclosed facility capacity: ${formatMetric(item.dataCenter?.disclosedCapacityMw,"MW")}; planned/full build: ${formatMetric(item.dataCenter?.plannedItLoadMw,"MW")}.`],
  ["Customers / Demand", item.customerTypes?.join(", ") ?? "N/D"], ["Infrastructure", item.infrastructure?.join(", ") ?? "N/D"],
  ["Revenue Drivers", item.sector === "coal" ? "Volume dan harga jual batubara; biaya logistik serta DMO memengaruhi margin." : "Permintaan colocation, utilisasi fasilitas, kontrak daya dan konektivitas."],
  ["Key Risks", item.sector === "coal" ? "RKAB, harga komoditas, DMO, biaya angkut dan izin." : "Eksekusi pembangunan, ketersediaan listrik, okupansi dan belanja modal."],
  ["Latest Developments", "Lihat tanggal dan isi sumber asli; pembaruan berita tidak diambil otomatis."],
].map(([heading,body]) => <div key={heading}><h3 className="text-micro font-bold uppercase tracking-widest text-amber">{heading}</h3><p className="mt-1 leading-relaxed text-ink">{body}</p></div>)}<div><h3 className="text-micro font-bold uppercase tracking-widest text-amber">Sources</h3>{item.sources.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="mt-1 block break-all text-cyan hover:underline">{s.name} · {s.verified} ↗</a>)}</div></section>; }
