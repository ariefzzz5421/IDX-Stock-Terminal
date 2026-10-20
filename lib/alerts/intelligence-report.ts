/**
 * Pure format helpers for evidence-linked Discord research alerts.
 * Never infer an announcement date from when the alert happened to be sent.
 */
export type ReportDetails = {
  announcementAt?: Date | string | null;
  effectiveAt?: Date | string | null;
  publishedAt?: Date | string | null;
  whatChanged?: string | null;
  materiality?: string | null;
  marketImpact?: string | null;
  monitorNext?: string | null;
  uncertainty?: string | null;
  direction?: string | null;
};

export function formatWibDate(value: Date | string | null | undefined): string {
  if (!value) return "N/D (belum diverifikasi)";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/D (tanggal tidak valid)";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric",
  }).format(parsed);
}

export function textForDiscord(value: unknown, maxLength: number): string {
  if (typeof value !== "string" || !value.trim()) return "N/D";
  return value.trim().replace(/@/g, "@\u200b").replaceAll(String.fromCharCode(96), "'").slice(0, maxLength);
}

/** Malformed or absent AI analysis must never prevent an otherwise verified delivery. */
export function parseReportAnalysis(value: string | null | undefined): Partial<ReportDetails> {
  if (!value) return {};
  try {
    const data: unknown = JSON.parse(value);
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    const obj = data as Record<string, unknown>;
    const out: Partial<ReportDetails> = {};
    for (const key of ["whatChanged", "materiality", "marketImpact", "monitorNext", "uncertainty"] as const) {
      if (typeof obj[key] === "string") out[key] = obj[key];
    }
    return out;
  } catch {
    return {};
  }
}

export function intelligenceReportFields(input: ReportDetails): Array<{ name: string; value: string; inline?: boolean }> {
  const field = (name: string, value: unknown, limit = 600) => ({
    name, value: textForDiscord(value, limit),
  });
  const dateFields = [
    { name: "Tanggal pengumuman", value: formatWibDate(input.announcementAt ?? input.publishedAt), inline: true },
    { name: "Tanggal efektif", value: formatWibDate(input.effectiveAt), inline: true },
  ];
  return [
    ...dateFields,
    field("Apa yang berubah", input.whatChanged),
    field("Mengapa penting", input.materiality),
    field("Perkiraan dampak pasar", input.marketImpact),
    field("Hal yang perlu dipantau", input.monitorNext),
  ];
}
