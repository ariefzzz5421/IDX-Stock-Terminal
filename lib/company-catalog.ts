import catalogJson from "@/prisma/idx-listing.json";

export type CompanyCatalogEntry = {
  code: string;
  name: string;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  logoUrl: string | null;
  listingDate: string | null;
  listedShares: number | null;
  localHoldingPct: number | null;
  foreignHoldingPct: number | null;
  recordedHoldingPct: number | null;
  holdingsDate: string;
  closingPrice: number | null;
};

export const COMPANY_CATALOG = catalogJson as CompanyCatalogEntry[];

const CATALOG_BY_CODE = new Map(
  COMPANY_CATALOG.map((company) => [company.code, company]),
);

export function getCompanyCatalogEntry(code: string) {
  return CATALOG_BY_CODE.get(code.toUpperCase()) ?? null;
}

export function getCompanyLogoUrl(code: string) {
  return getCompanyCatalogEntry(code)?.logoUrl ?? null;
}
