"use client";

import { useLayoutEffect, useRef } from "react";
import {
  CandlestickSeries,
  HistogramSeries,
  createChart,
  type IChartApi,
  type UTCTimestamp,
} from "lightweight-charts";

export type ChartCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const UP = "#2bd97c";
const DOWN = "#ff4b57";
const GRID = "#1b202b";
const TEXT = "#626b7c";

export function Chart({ candles }: { candles: ChartCandle[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      const chart = createChart(container, {
        layout: {
          background: { color: "transparent" },
          textColor: TEXT,
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: GRID },
          horzLines: { color: GRID },
        },
        rightPriceScale: { borderColor: GRID },
        timeScale: { borderColor: GRID, timeVisible: true, secondsVisible: false },
        crosshair: {
          vertLine: { color: "#47a8d8", labelBackgroundColor: "#47a8d8" },
          horzLine: { color: "#47a8d8", labelBackgroundColor: "#47a8d8" },
        },
        autoSize: true,
      });
      chartRef.current = chart;

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: UP,
        downColor: DOWN,
        borderUpColor: UP,
        borderDownColor: DOWN,
        wickUpColor: UP,
        wickDownColor: DOWN,
        priceFormat: { type: "price", precision: 0, minMove: 1 },
      });

      // Volume shares the pane, pinned to the bottom fifth.
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      candleSeries.setData(
        candles.map((candle) => ({
          time: Math.floor(candle.time / 1000) as UTCTimestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        })),
      );

      volumeSeries.setData(
        candles.map((candle) => ({
          time: Math.floor(candle.time / 1000) as UTCTimestamp,
          value: candle.volume,
          color: candle.close >= candle.open ? `${UP}55` : `${DOWN}55`,
        })),
      );

      chart.timeScale().fitContent();

      return () => {
        chart.remove();
        chartRef.current = null;
      };
    } catch (chartError) {
      console.error("[chart] could not render:", chartError);
      container.textContent =
        "Chart could not render. Price statistics remain available beside it.";
      container.classList.add(
        "grid",
        "place-items-center",
        "p-4",
        "text-center",
        "text-xs",
        "text-dim",
      );
    }
  }, [candles]);

  if (candles.length === 0) {
    return <p className="p-3 text-[12px] text-dim">No price history available.</p>;
  }

  return (
    <div className="relative h-[25rem] w-full">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
