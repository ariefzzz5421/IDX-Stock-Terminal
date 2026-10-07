export type ResearchSession = "morning" | "evening";

export function jakartaDay(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function scheduledSlot(date: Date, session: ResearchSession): string {
  return `scheduled:${jakartaDay(date)}:${session}`;
}

export function sessionLabel(slot: string): string {
  if (slot.endsWith(":morning")) return "Pagi · 08.00 WIB";
  if (slot.endsWith(":evening")) return "Malam · 21.00 WIB";
  return slot.startsWith("manual:") ? "Manual" : "Terjadwal";
}
