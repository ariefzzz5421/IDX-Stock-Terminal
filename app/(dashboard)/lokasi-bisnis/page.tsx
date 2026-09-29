import type { Metadata } from "next";
import { BusinessWorkspace } from "@/components/business-map/BusinessWorkspace";
import { BUSINESS_LOCATIONS } from "@/data/business-locations";

export const metadata: Metadata = { title: "Lokasi Bisnis — IDX Terminal" };

export default function LokasiBisnisPage() {
  return <BusinessWorkspace locations={BUSINESS_LOCATIONS} />;
}
