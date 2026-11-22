"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { firma } from "@/config/firma";

export default function MapaOblasti() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let mapa: import("leaflet").Map | undefined;
    let zrusene = false;
    import("leaflet").then((L) => {
      if (zrusene || !el.current) return;
      const { lat, lng, polomerKm } = firma.oblast;
      mapa = L.map(el.current, { scrollWheelZoom: false }).setView([lat, lng], 9);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap", maxZoom: 18 }).addTo(mapa);
      const kruh = L.circle([lat, lng], { radius: polomerKm * 1000, color: "#ff9a3c", weight: 2, fillColor: "#ff9a3c", fillOpacity: 0.12 }).addTo(mapa);
      L.circleMarker([lat, lng], { radius: 8, color: "#161616", weight: 3, fillColor: "#ff9a3c", fillOpacity: 1 }).addTo(mapa).bindPopup(firma.nazov);
      mapa.fitBounds(kruh.getBounds(), { padding: [20, 20] });
    });
    return () => {
      zrusene = true;
      mapa?.remove();
    };
  }, []);
  return <div ref={el} className="h-[60vh] w-full overflow-hidden rounded-[2rem] shadow-sm ring-1 ring-black/5" />;
}
