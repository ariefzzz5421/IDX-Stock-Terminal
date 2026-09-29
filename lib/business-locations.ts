export type BusinessSector = "coal" | "data-center" | "nickel" | "copper" | "gold" | "cpo" | "industrial-estate" | "power" | "wte" | "telecom" | "ports" | "cement" | "oil-gas";
export type AssetStatus = "operational" | "construction" | "planned";
export type CoordinatePrecision = "exact" | "approximate";
export type Source = { name: string; url: string; verified: string };

export interface BusinessLocation {
  id: string;
  sector: BusinessSector;
  ticker?: string;
  listedCompany?: string;
  company: string;
  subsidiary?: string;
  assetName: string;
  assetType: string;
  province: string;
  regency?: string;
  district?: string;
  latitude: number;
  longitude: number;
  coordinatePrecision: CoordinatePrecision;
  status: AssetStatus;
  description: string;
  businessModel: string;
  infrastructure?: string[];
  customerTypes?: string[];
  products?: string[];
  investorRelevance?: string;
  coal?: { production2025Mt?: number; rkab2026Mt?: number; reservesMt?: number; areaHa?: number; coalType?: string };
  dataCenter?: { disclosedCapacityMw?: number; capacityBasis?: string; operationalItLoadMw?: number; plannedItLoadMw?: number; racks?: number; pue?: number; powerSource?: string; aiReady?: boolean; certification?: string };
  pipelineCategory?: "ai-infrastructure";
  sources: Source[];
}

export const SECTORS: { id: BusinessSector; label: string; marker: string }[] = [
  { id: "coal", label: "Batubara", marker: "⛏" },
  { id: "data-center", label: "Data Center", marker: "▣" },
];

export const STATUS_LABEL: Record<AssetStatus, string> = {
  operational: "Operational", construction: "Construction", planned: "Planned",
};

export function formatMetric(value: number | undefined, unit = "") {
  return value === undefined ? "N/D" : `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value)}${unit ? ` ${unit}` : ""}`;
}
