"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { HeroMapaOrganizacji } from "@/lib/wies/poi-organizacji-hero";

const STYL: Record<
  HeroMapaOrganizacji["wariant"],
  { color: string; fill: string; border: string; bg: string; text: string }
> = {
  parafia: {
    color: "#5b21b6",
    fill: "#a78bfa",
    border: "border-violet-300/60",
    bg: "bg-violet-50/80",
    text: "text-violet-900",
  },
  osp: {
    color: "#991b1b",
    fill: "#f87171",
    border: "border-red-300/60",
    bg: "bg-red-50/80",
    text: "text-red-900",
  },
  sport: {
    color: "#0369a1",
    fill: "#38bdf8",
    border: "border-sky-300/60",
    bg: "bg-sky-50/80",
    text: "text-sky-900",
  },
  kgw: {
    color: "#be185d",
    fill: "#f472b6",
    border: "border-rose-300/60",
    bg: "bg-rose-50/80",
    text: "text-rose-900",
  },
};

type Props = HeroMapaOrganizacji & { wysokosc?: number };

/** Kompaktowa mapa z pinezką miejsca organizacji (kościół, remiza, boisko…). */
export function OrganizacjaMiniMapaPunktKlient({
  lat,
  lng,
  linkPelnaMapa,
  etykietaLink,
  wariant,
  nazwaMiejsca,
  dodatkowePiny = [],
  wysokosc = 168,
}: Props) {
  const styl = STYL[wariant];
  const [ref, setRef] = useState<HTMLDivElement | null>(null);
  const refMapa = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    if (!ref || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
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

      const warstwy: import("leaflet").CircleMarker[] = [];

      const glowny = L.circleMarker([lat, lng], {
        radius: 11,
        color: styl.color,
        weight: 2.5,
        fillColor: styl.fill,
        fillOpacity: 0.92,
      }).addTo(map);
      warstwy.push(glowny);

      for (const pin of dodatkowePiny) {
        if (!Number.isFinite(pin.lat) || !Number.isFinite(pin.lng)) continue;
        const marker = L.circleMarker([pin.lat, pin.lng], {
          radius: 9,
          color: pin.kolor,
          weight: 2,
          fillColor: pin.fill,
          fillOpacity: 0.9,
        }).addTo(map);
        warstwy.push(marker);
      }

      if (warstwy.length > 1) {
        const bounds = L.latLngBounds(warstwy.map((m) => m.getLatLng()));
        map.fitBounds(bounds.pad(0.35), { maxZoom: 15 });
      } else {
        map.setView([lat, lng], 15);
      }

      refMapa.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    })();

    return () => {
      cancelled = true;
      refMapa.current?.remove();
      refMapa.current = null;
    };
  }, [ref, lat, lng, styl.color, styl.fill, dodatkowePiny]);

  const maDwaMiejsca = dodatkowePiny.length > 0;

  return (
    <div className={`organizacja-hero-mapa overflow-hidden rounded-xl border bg-white shadow-md ${styl.border}`}>
      <div
        ref={setRef}
        style={{ height: wysokosc }}
        className="w-full"
        role="img"
        aria-label={
          maDwaMiejsca
            ? `Mapa: ${nazwaMiejsca ?? "kościół"} i ${dodatkowePiny[0]?.nazwa ?? "cmentarz"}`
            : nazwaMiejsca
              ? `Mapa: ${nazwaMiejsca}`
              : "Podgląd lokalizacji na mapie"
        }
      />
      {linkPelnaMapa ? (
        <p className={`border-t px-3 py-2 text-center text-[11px] ${styl.bg}`}>
          {maDwaMiejsca ? (
            <span className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-1 ${styl.text}`}>
              {nazwaMiejsca ? (
                <Link href={linkPelnaMapa} className="font-semibold underline hover:opacity-90">
                  {nazwaMiejsca} ↗
                </Link>
              ) : (
                <Link href={linkPelnaMapa} className="font-semibold underline hover:opacity-90">
                  {etykietaLink}
                </Link>
              )}
              {dodatkowePiny[0]?.link ? (
                <>
                  <span className="opacity-50" aria-hidden>
                    ·
                  </span>
                  <Link href={dodatkowePiny[0].link} className="font-semibold underline hover:opacity-90">
                    {dodatkowePiny[0].nazwa} ↗
                  </Link>
                </>
              ) : null}
            </span>
          ) : (
            <>
              {nazwaMiejsca ? <span className={`mr-1 ${styl.text} opacity-80`}>{nazwaMiejsca} ·</span> : null}
              <Link href={linkPelnaMapa} className={`font-semibold underline ${styl.text} hover:opacity-90`}>
                {etykietaLink}
              </Link>
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}
