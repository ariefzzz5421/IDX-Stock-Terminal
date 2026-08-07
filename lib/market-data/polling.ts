import type { MarketDataProvider, QuoteListener, Unsubscribe } from "./types";

/**
 * Turns a REST provider into a push stream. Shared by every adapter that has
 * no native socket, so the polling cadence and overlap guard live in one place.
 */
export function pollingSubscription(
  provider: MarketDataProvider,
  codes: string[],
  onQuote: QuoteListener,
): Unsubscribe {
  const every = Math.max(1000, Number(process.env.QUOTE_POLL_INTERVAL_MS ?? 5000));
  let stopped = false;
  let inFlight = false;

  async function poll() {
    // A slow provider must not stack requests on top of each other.
    if (stopped || inFlight) return;
    inFlight = true;

    try {
      const quotes = await provider.getQuotes(codes);
      if (!stopped) quotes.forEach(onQuote);
    } catch (error) {
      console.error(`[market-data] ${provider.name} poll failed:`, error);
    } finally {
      inFlight = false;
    }
  }

  void poll();
  const timer = setInterval(poll, every);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
