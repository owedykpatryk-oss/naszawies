"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { walidujObszarPolowania, type GeoJsonPolygonPolowania } from "@/lib/lowiectwo/geojson-obszar";

type Props = {
  rewirGeojson: unknown;
  linkPelnaMapa?: string | null;
  wysokosc?: number;
};

function polygonZGeojson(raw: unknown): GeoJsonPolygonPolowania | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as { type?: string; geometry?: unknown };
  if (o.type === "Feature" && o.geometry) return walidujObszarPolowania(o.geometry);
  return walidujObszarPolowania(raw);
}

/** Kompaktowy podgląd rewiru łowieckiego w hero mini-strony. */
export function OrganizacjaMiniMapaRewiruKlient({
  rewirGeojson,
  linkPelnaMapa = "/mapa?warstwa=lowiectwo",
  wysokosc = 168,
}: Props) {
  const polygon = polygonZGeojson(rewirGeojson);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const refMapa = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!ref || !polygon) return;
    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled) return;

      const map = L.map(ref, {
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: true,
        dragging: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OSM",
        maxZoom: 18,
      }).addTo(map);

      const latlngs = polygon.coordinates[0]!.map(([lng, lat]) => L.latLng(lat, lng));
      const warstwa = L.polygon(latlngs, {
        color: "#166534",
        weight: 2,
        fillColor: "#22c55e",
        fillOpacity: 0.28,
      }).addTo(map);

      map.fitBounds(warstwa.getBounds().pad(0.12), { maxZoom: 14 });

      refMapa.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    })();

    return () => {
      cancelled = true;
      refMapa.current?.remove();
      refMapa.current = null;
    };
  }, [ref, polygon]);

  if (!polygon) return null;

  return (
    <div className="organizacja-hero-mapa overflow-hidden rounded-xl border border-emerald-300/60 bg-white shadow-md">
      <div
        ref={setRef}
        style={{ height: wysokosc }}
        className="w-full"
        role="img"
        aria-label="Podgląd obwodu łowieckiego na mapie"
      />
      {linkPelnaMapa ? (
        <p className="border-t border-emerald-100 bg-emerald-50/80 px-3 py-2 text-center text-[11px]">
          <Link href={linkPelnaMapa} className="font-semibold text-emerald-900 underline hover:text-emerald-950">
            Rewir na mapie łowiectwa ↗
          </Link>
        </p>
      ) : null}
    </div>
  );
}
