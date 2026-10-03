import { cookies } from "next/headers";

export type UiLanguage = "id" | "en";

export async function getUiLanguage(): Promise<UiLanguage> {
  return (await cookies()).get("idx-language")?.value === "en" ? "en" : "id";
}

export const uiCopy = {
  id: {
    stocks: "saham", up: "naik", down: "turun",
    delayed: "Snapshot pasar", stored: "Harga tersimpan · mungkin usang",
    noPrice: "Belum ada harga.", noVolume: "Belum ada volume tercatat.",
    watchlistEmpty: "Belum ada saham pantauan. Cari kode saham, lalu tambahkan dari halaman saham.",
  },
  en: {
    stocks: "stocks", up: "up", down: "down",
    delayed: "Market snapshot", stored: "Stored quotes · may be stale",
    noPrice: "No prices available.", noVolume: "No recorded volume yet.",
    watchlistEmpty: "Your watchlist is empty. Search for a ticker and add it from the stock page.",
  },
} as const;
