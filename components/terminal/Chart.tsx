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

function chartPalette() {
  const styles = getComputedStyle(document.documentElement);
  const read = (token: string) => styles.getPropertyValue(token).trim();
  return {
    up: read("--color-up") || "#2bd97c",
    down: read("--color-down") || "#ff4b57",
    grid: read("--color-rule") || "#1b202b",
    text: read("--color-dim") || "#626b7c",
    cyan: read("--color-cyan") || "#47a8d8",
  };
}

export function Chart({ candles, intraday = true }: { candles: ChartCandle[]; intraday?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    try {
      const initial = chartPalette();
      const chart = createChart(container, {
        layout: {
          background: { color: "transparent" },
          textColor: initial.text,
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          attributionLogo: false,
        },
        grid: {
          vertLines: { color: initial.grid },
          horzLines: { color: initial.grid },
        },
        rightPriceScale: { borderColor: initial.grid },
        timeScale: { borderColor: initial.grid, timeVisible: intraday, secondsVisible: false },
        crosshair: {
          vertLine: { color: initial.cyan, labelBackgroundColor: initial.cyan },
          horzLine: { color: initial.cyan, labelBackgroundColor: initial.cyan },
        },
        autoSize: true,
      });
      chartRef.current = chart;

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: initial.up,
        downColor: initial.down,
        borderUpColor: initial.up,
        borderDownColor: initial.down,
        wickUpColor: initial.up,
        wickDownColor: initial.down,
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

      function updateTheme() {
        const colors = chartPalette();
        chart.applyOptions({
          layout: { textColor: colors.text },
          grid: { vertLines: { color: colors.grid }, horzLines: { color: colors.grid } },
          rightPriceScale: { borderColor: colors.grid },
          timeScale: { borderColor: colors.grid },
          crosshair: {
            vertLine: { color: colors.cyan, labelBackgroundColor: colors.cyan },
            horzLine: { color: colors.cyan, labelBackgroundColor: colors.cyan },
          },
        });
        candleSeries.applyOptions({ upColor: colors.up, downColor: colors.down, borderUpColor: colors.up, borderDownColor: colors.down, wickUpColor: colors.up, wickDownColor: colors.down });
        volumeSeries.setData(candles.map((candle) => ({
          time: Math.floor(candle.time / 1000) as UTCTimestamp,
          value: candle.volume,
          color: candle.close >= candle.open ? `${colors.up}55` : `${colors.down}55`,
        })));
      }
      updateTheme();
      const themeObserver = new MutationObserver(updateTheme);
      themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

      chart.timeScale().fitContent();

      return () => {
        themeObserver.disconnect();
        chart.remove();
        chartRef.current = null;
      };
    } catch (chartError) {
      console.error("[chart] could not render:", chartError);
      container.textContent =
        "Grafik tidak dapat ditampilkan. Statistik harga tetap tersedia di sampingnya.";
      container.classList.add(
        "grid",
        "place-items-center",
        "p-4",
        "text-center",
        "text-xs",
        "text-dim",
      );
    }
  }, [candles, intraday]);

  if (candles.length === 0) {
    return <p className="p-3 text-[12px] text-dim">Riwayat harga belum tersedia.</p>;
  }

  return (
    <div className="relative h-[25rem] w-full">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
