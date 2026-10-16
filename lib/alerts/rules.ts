export const PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "WATCH"] as const;
export type AlertPriority = (typeof PRIORITIES)[number];

export function eligiblePriorities(minimum: AlertPriority): string[] {
  const index = PRIORITIES.indexOf(minimum);
  return PRIORITIES.slice(0, index < 0 ? 1 : index);
}

export function isAlertEligible(
  priority: string,
  status: string,
  minimum: AlertPriority,
  includePreliminary: boolean,
): boolean {
  return eligiblePriorities(minimum).includes(priority) &&
    (status === "CONFIRMED" || (includePreliminary && status === "PRELIMINARY"));
}

export function nextRetryDelayMs(attempt: number, retryAfterMs = 0): number {
  const backoff = Math.min(6 * 60 * 60_000, 60_000 * 2 ** Math.max(0, Math.min(attempt - 1, 8)));
  return Math.max(backoff, Math.min(Math.max(0, retryAfterMs), 24 * 60 * 60_000));
}

export function safeHttpsUrl(raw: string): string | null {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function isDiscordWebhookUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === "https:" &&
      (url.hostname === "discord.com" || url.hostname === "discordapp.com") &&
      /^\/api\/webhooks\/\d+\/[a-zA-Z0-9_-]+\/?$/.test(url.pathname) &&
      !url.search && !url.hash;
  } catch {
    return false;
  }
}
