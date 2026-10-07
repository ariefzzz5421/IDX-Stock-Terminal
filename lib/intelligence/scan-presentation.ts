type ScanSummary = {
  status: string;
  endedAt: Date | null;
  newEvents: number;
  updatedEvents: number;
};

function jakartaDay(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function scanHeadline(run: ScanSummary | null, now: Date): string {
  if (!run) return "Belum ada pemindaian riset yang tercatat.";
  if (run.status === "RUNNING") return "Pemindaian sedang berlangsung. Hasil hari ini belum dapat disimpulkan.";
  if (run.status === "PARTIAL") return "Pemindaian sebagian: ada sumber atau dokumen yang belum berhasil diperiksa. Belum dapat disimpulkan bahwa hari ini tidak ada peristiwa baru.";
  if (run.status !== "SUCCESS") return "Pemindaian gagal. Belum dapat disimpulkan bahwa hari ini tidak ada peristiwa baru.";

  if (!run.endedAt || jakartaDay(run.endedAt) !== jakartaDay(now)) {
    return "Belum ada pemindaian berhasil hari ini. Hasil terakhir tersimpan sebagai arsip.";
  }
  if (run.newEvents === 0 && run.updatedEvents === 0) {
    return "Tidak ada temuan material baru pada pemindaian hari ini dari sumber KSEI yang terhubung.";
  }
  return `${run.newEvents} peristiwa baru · ${run.updatedEvents} pembaruan substantif dari pemindaian hari ini.`;
}

export function runOutcome(run: ScanSummary): string {
  if (run.status === "RUNNING") return "Sedang memindai";
  if (run.status === "PARTIAL") return "Sebagian sumber atau dokumen belum selesai diperiksa";
  if (run.status !== "SUCCESS") return "Gagal; tidak dapat menyimpulkan tidak ada berita";
  if (run.newEvents === 0 && run.updatedEvents === 0) return "Tidak ada temuan material baru dari sumber KSEI yang terhubung";
  return `${run.newEvents} riset baru · ${run.updatedEvents} pembaruan`;
}
