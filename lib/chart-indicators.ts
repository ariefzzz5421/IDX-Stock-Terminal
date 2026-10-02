import type { ChartCandle } from "@/components/terminal/Chart";

export const INDICATORS = [
  { key: "sma", name: "Moving Average", short: "SMA 20", category: "Trend", description: "Simple moving average · 20 bars" },
  { key: "ema", name: "Exponential Moving Average", short: "EMA 20", category: "Trend", description: "Exponential moving average · 20 bars" },
  { key: "bb", name: "Bollinger Bands", short: "BB 20, 2", category: "Trend", description: "20 bars · 2 standard deviations" },
  { key: "vwap", name: "Volume Weighted Average Price", short: "VWAP", category: "Volume", description: "Cumulative over the displayed range" },
  { key: "rsi", name: "Relative Strength Index", short: "RSI 14", category: "Momentum", description: "Relative strength index · 14 bars" },
  { key: "macd", name: "MACD", short: "MACD 12, 26, 9", category: "Momentum", description: "Moving average convergence divergence" },
] as const;

export type IndicatorKey = (typeof INDICATORS)[number]["key"];
export type IndicatorPoint = { time: number; value: number };

export function sma(values: number[], period: number): Array<number | null> {
  let sum = 0;
  return values.map((value, index) => {
    sum += value;
    if (index >= period) sum -= values[index - period];
    return index >= period - 1 ? sum / period : null;
  });
}

export function ema(values: number[], period: number): Array<number | null> {
  const seed = sma(values, period);
  let previous: number | null = null;
  return values.map((value, index) => {
    if (index < period - 1) return null;
    previous = previous === null ? seed[index] : value * (2 / (period + 1)) + previous * (1 - 2 / (period + 1));
    return previous;
  });
}

export function rsi(values: number[], period = 14): Array<number | null> {
  let gain = 0;
  let loss = 0;
  return values.map((value, index) => {
    if (index === 0) return null;
    const change = value - values[index - 1];
    const up = Math.max(change, 0);
    const down = Math.max(-change, 0);
    if (index <= period) {
      gain += up;
      loss += down;
      if (index < period) return null;
      gain /= period;
      loss /= period;
    } else {
      gain = (gain * (period - 1) + up) / period;
      loss = (loss * (period - 1) + down) / period;
    }
    if (loss === 0) return gain === 0 ? 50 : 100;
    return 100 - 100 / (1 + gain / loss);
  });
}

export function seriesPoints(candles: ChartCandle[], values: Array<number | null>): IndicatorPoint[] {
  return values.flatMap((value, index) => value !== null && Number.isFinite(value)
    ? [{ time: Math.floor(candles[index].time / 1000), value }]
    : []);
}

export function bollinger(values: number[], period = 20, multiplier = 2) {
  const middle = sma(values, period);
  const deviation = values.map((_, index) => {
    if (index < period - 1 || middle[index] === null) return null;
    const mean = middle[index]!;
    const variance = values.slice(index - period + 1, index + 1).reduce((sum, value) => sum + (value - mean) ** 2, 0) / period;
    return Math.sqrt(variance) * multiplier;
  });
  return {
    middle,
    upper: middle.map((value, index) => value === null ? null : value + deviation[index]!),
    lower: middle.map((value, index) => value === null ? null : value - deviation[index]!),
  };
}

export function vwap(candles: ChartCandle[]): Array<number | null> {
  let priceVolume = 0;
  let volume = 0;
  return candles.map((candle) => {
    if (candle.volume > 0) {
      priceVolume += ((candle.high + candle.low + candle.close) / 3) * candle.volume;
      volume += candle.volume;
    }
    return volume > 0 ? priceVolume / volume : null;
  });
}

export function macd(values: number[]) {
  const fast = ema(values, 12);
  const slow = ema(values, 26);
  const line = values.map((_, index) => fast[index] === null || slow[index] === null ? null : fast[index]! - slow[index]!);
  const ready = line.filter((value): value is number => value !== null);
  const signalReady = ema(ready, 9);
  let readyIndex = 0;
  const signal = line.map((value) => value === null ? null : signalReady[readyIndex++]);
  return { line, signal, histogram: line.map((value, index) => value === null || signal[index] === null ? null : value - signal[index]!) };
}
