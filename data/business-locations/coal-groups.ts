import type { Source } from "@/lib/business-locations";

// Consolidated 2025 production, only where a comparable company disclosure was verified.
// Never distribute a group number over individual mine markers.
export const COAL_GROUP_PRODUCTION: Record<string, { mt: number; source: Source }> = {
  BYAN: { mt: 68, source: { name: "Bayan Investor Update 4Q 2025, p. 3/12", url: "https://www.bayan.com.sg/cfind/source/files/investor/investor-update/investor-update-4q-2025.pdf", verified: "2026-09-30" } },
  AADI: { mt: 68.73, source: { name: "AADI Annual Report 2025, p. 75", url: "https://adaroindonesia.com/app/webroot/upload/files/Laporan%20Tahunan/AADI%20Annual%20Report%202025.pdf", verified: "2026-09-29" } },
  GEMS: { mt: 54.95, source: { name: "GEMS Annual Report 2025, p. 48", url: "https://www.goldenenergymines.com/wp-content/files/AR_2025__GEMS_Lengkap_270426_highres.pdf", verified: "2026-09-29" } },
  INDY: { mt: 30, source: { name: "Indika Company Update FY2025, p. 45 (Kideco)", url: "https://www.indikaenergy.co.id/wp-content/uploads/2026/03/Company-Update-FY2025-v-full.3-2.pdf", verified: "2026-09-29" } },
};
