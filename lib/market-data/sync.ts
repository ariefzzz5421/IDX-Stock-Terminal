import "server-only";

import { prisma } from "@/lib/db/prisma";
import { marketData } from "./index";
import type { Quote } from "./types";

/**
 * Pull fresh quotes for `codes` and write them back to the `stocks` table, so
 * a page render always has something to show even when the provider is down.
 * Returns whatever it managed to fetch.
 */
export async function refreshQuotes(codes: string[]): Promise<Quote[]> {
  if (codes.length === 0) return [];

  let quotes: Quote[];

  try {
    quotes = await marketData.getQuotes(codes);
  } catch (error) {
    // A dead provider must not take the dashboard down with it — the caller
    // falls back to the last values stored in the database.
    console.error("[market-data] refresh failed:", error);
    return [];
  }

  await Promise.all(
    quotes.map((quote) =>
      prisma.stock.update({
        where: { code: quote.code },
        data: {
          lastPrice: quote.price,
          prevClose: quote.prevClose,
          lastChangePct: quote.changePct,
          lastVolume: quote.volume,
          lastValue: quote.value,
        },
      }),
    ),
  ).catch((error) => {
    // A quote for a ticker that isn't seeded will fail its update; that is not
    // worth failing the whole request over.
    console.error("[market-data] could not persist quotes:", error);
  });

  return quotes;
}
