"use client";

type Punkt = {
  id: string;
  nazwa: string;
  sciezka: string;
  lat: number;
  lon: number;
};

function bboxZPunktow(punkty: Punkt[]): string | null {
  if (punkty.length === 0) return null;
  let minLat = 90;
  let maxLat = -90;
  let minLon = 180;
  let maxLon = -180;
  for (const p of punkty) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLon = Math.min(minLon, p.lon);
    maxLon = Math.max(maxLon, p.lon);
  }
  const pad = 0.04;
  if (maxLon - minLon < 0.02) {
    minLon -= pad;
    maxLon += pad;
  } else {
    minLon -= pad * 0.5;
    maxLon += pad * 0.5;
  }
  if (maxLat - minLat < 0.02) {
    minLat -= pad;
    maxLat += pad;
  } else {
    minLat -= pad * 0.5;
    maxLat += pad * 0.5;
  }
  return `${minLon},${minLat},${maxLon},${maxLat}`;
}

export function MapaWsiOsm({ punkty }: { punkty: Punkt[] }) {
  const bbox = bboxZPunktow(punkty);
  const src =
    bbox !== null
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik`
      : null;

  return (
    <div className="space-y-4">
      {src ? (
        <div className="overflow-hidden rounded-xl border border-stone-200 shadow-sm">
          <iframe
            title="Mapa — podgląd regionu (OpenStreetMap)"
            className="h-[min(420px,55vh)] w-full border-0"
            src={src}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
      <p className="text-xs text-stone-500">
        Ramka pokazuje obszar obejmujący aktywne wsie z uzupełnionymi współrzędnymi. Kliknij nazwę w liście, aby
        przejść do profilu wsi.
      </p>
    </div>
  );
}
