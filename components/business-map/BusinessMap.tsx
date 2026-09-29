"use client";

import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";
import type { BusinessLocation } from "@/lib/business-locations";
import { formatMetric, STATUS_LABEL } from "@/lib/business-locations";

const INDONESIA: [number, number] = [-2.4, 117.3];
type MapState = { map: Leaflet.Map; layer: Leaflet.LayerGroup; L: typeof Leaflet };

export default function BusinessMap({ locations, selectedId, onSelect, fitVersion, resetVersion, onFailure }: { locations: BusinessLocation[]; selectedId: string | null; onSelect: (id: string) => void; fitVersion: number; resetVersion: number; onFailure: () => void }) {
  const container = useRef<HTMLDivElement>(null);
  const state = useRef<MapState | null>(null);
  const latest = useRef({ locations, selectedId, onSelect, onFailure });
  useEffect(() => { latest.current = { locations, selectedId, onSelect, onFailure }; }, [locations, selectedId, onSelect, onFailure]);

  useEffect(() => {
    let cancelled = false;
    let local: MapState | null = null;
    import("leaflet").then((L) => {
      if (cancelled || !container.current) return;
      const map = L.map(container.current, { center: INDONESIA, zoom: 5, minZoom: 4, zoomControl: true, scrollWheelZoom: true });
      let failedTiles = 0;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' })
        .on("tileerror", () => { if (++failedTiles >= 3 && !cancelled) latest.current.onFailure(); })
        .addTo(map);
      const layer = L.layerGroup().addTo(map);
      local = { map, layer, L };
      state.current = local;
      renderMarkers(local, latest.current.locations, latest.current.selectedId, latest.current.onSelect);
      requestAnimationFrame(() => { if (!cancelled) map.invalidateSize(); });
    }).catch(() => { if (!cancelled) latest.current.onFailure(); });
    return () => { cancelled = true; local?.map.remove(); if (state.current === local) state.current = null; };
  }, []);

  useEffect(() => { if (state.current) renderMarkers(state.current, locations, selectedId, onSelect); }, [locations, selectedId, onSelect]);
  useEffect(() => {
    const current = state.current;
    if (current && fitVersion && locations.length) current.map.fitBounds(current.L.latLngBounds(locations.map((item) => [item.latitude, item.longitude])), { padding: [35, 35], maxZoom: 9 });
  }, [fitVersion, locations]);
  useEffect(() => { if (resetVersion) state.current?.map.setView(INDONESIA, 5); }, [resetVersion]);
  useEffect(() => {
    const item = locations.find((loc) => loc.id === selectedId);
    if (item && state.current) state.current.map.flyTo([item.latitude, item.longitude], Math.max(state.current.map.getZoom(), 7), { duration: 0.7 });
  }, [selectedId, locations]);
  return <div ref={container} className="h-full w-full" role="img" aria-label="Peta lokasi bisnis Indonesia; semua lokasi dapat dipilih melalui daftar di samping" />;
}

function renderMarkers({ layer, L }: MapState, locations: BusinessLocation[], selectedId: string | null, onSelect: (id: string) => void) {
  layer.clearLayers();
  for (const item of locations) {
    const glyph = item.sector === "coal" ? "⛏" : "▣";
    const icon = L.divIcon({ className: "business-pin-wrap", iconSize: [30, 30], iconAnchor: [15, 15], html: `<span class="business-pin ${item.sector === "coal" ? "coal" : "dc"} ${item.status} ${selectedId === item.id ? "selected" : ""}" aria-hidden="true">${glyph}</span>` });
    const marker = L.marker([item.latitude, item.longitude], { icon, title: `${item.company}: ${item.assetName}` });
    const popup = document.createElement("div");
    popup.className = "business-popup";
    const heading = document.createElement("strong");
    heading.textContent = item.ticker ?? item.company;
    popup.append(heading, document.createElement("br"), document.createTextNode(item.assetName), document.createElement("br"), document.createTextNode(`${item.regency ?? item.province} · ${STATUS_LABEL[item.status]}`), document.createElement("br"), document.createTextNode(item.coordinatePrecision === "approximate" ? "Lokasi perkiraan" : "Koordinat terverifikasi"), document.createElement("br"), document.createTextNode(item.sector === "coal" ? `Produksi 2025: ${formatMetric(item.coal?.production2025Mt, "Mt")}` : `Kapasitas fasilitas: ${formatMetric(item.dataCenter?.disclosedCapacityMw, "MW")}`), document.createElement("br"));
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "View details →";
    button.addEventListener("click", () => onSelect(item.id));
    popup.append(button);
    marker.bindPopup(popup);
    marker.on("click", () => onSelect(item.id));
    marker.on("mouseover", () => marker.openPopup());
    marker.addTo(layer);
  }
}
