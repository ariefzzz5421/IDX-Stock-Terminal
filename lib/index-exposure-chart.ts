import type { ForeignFlowResult } from "./foreign-flow";
import type { IndonesiaIndexSnapshot } from "./index-exposure";

export type IndexPieSlice = {
  code: string | null;
  label: string;
  value: number;
  netValue: number | null;
};

export function indexWeightSlices(snapshot: IndonesiaIndexSnapshot): IndexPieSlice[] {
  const listed: IndexPieSlice[] = snapshot.constituents
    .filter((stock) => Number.isFinite(stock.weightPct) && stock.weightPct > 0)
    .map((stock) => ({ code: stock.code, label: stock.name, value: stock.weightPct, netValue: null }));
  const listedWeight = listed.reduce((sum, stock) => sum + stock.value, 0);
  const remainingWeight = Math.max(0, Math.round((100 - listedWeight) * 100) / 100);
  if (remainingWeight > 0.005) {
    listed.push({ code: null, label: `${Math.max(0, snapshot.totalConstituents - listed.length)} saham lainnya`, value: remainingWeight, netValue: null });
  }
  return listed;
}

export function indexFlowSlices(snapshot: IndonesiaIndexSnapshot, flow: ForeignFlowResult): IndexPieSlice[] {
  if (!flow.available) return [];
  const constituents = new Map(snapshot.constituents.map((stock) => [stock.code, stock]));
  const byTicker = new Map<string, IndexPieSlice>();
  for (const row of [...flow.topBuy, ...flow.topSell]) {
    const stock = constituents.get(row.code);
    const netValue = row.estimatedNetValue;
    if (!stock || netValue == null || !Number.isFinite(netValue) || netValue === 0) continue;
    const previous = byTicker.get(row.code);
    const combined = (previous?.netValue ?? 0) + netValue;
    byTicker.set(row.code, { code: row.code, label: stock.name, value: Math.abs(combined), netValue: combined });
  }
  return [...byTicker.values()].filter((slice) => slice.value > 0).sort((a, b) => b.value - a.value);
}
