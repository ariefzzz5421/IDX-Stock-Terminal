export const CHART_RANGES = [
  { key: "1H", label: "1H · 1 Hour", interval: "1m", yahooRange: "1d", maxBars: 60 },
  { key: "4H", label: "4H · 4 Hours", interval: "5m", yahooRange: "5d", maxBars: 48 },
  { key: "1D", label: "1D · 1 Day", interval: "5m", yahooRange: "5d", maxBars: 100 },
  { key: "1W", label: "1W · 1 Week", interval: "60m", yahooRange: "5d", maxBars: 100 },
  { key: "1M", label: "1M · 1 Month", interval: "1d", yahooRange: "1mo", maxBars: 35 },
  { key: "3M", label: "3M · 3 Months", interval: "1d", yahooRange: "3mo", maxBars: 75 },
  { key: "1Y", label: "1Y · 1 Year", interval: "1d", yahooRange: "1y", maxBars: 270 },
  { key: "5Y", label: "5Y · 5 Years", interval: "1wk", yahooRange: "5y", maxBars: 270 },
  { key: "10Y", label: "10Y · 10 Years", interval: "1mo", yahooRange: "10y", maxBars: 130 },
  { key: "MAX", label: "MAX · All available", interval: "1mo", yahooRange: "max", maxBars: 600 },
] as const;

export type ChartRange = (typeof CHART_RANGES)[number]["key"];
export function isChartRange(value: string): value is ChartRange {
  return CHART_RANGES.some((range) => range.key === value);
}
