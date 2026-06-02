import type { AktywnoscFitnessPubliczna } from "@/lib/wies/pobierz-aktywnosci-fitness-wsi";
import {
  etykietaRodzajuAktywnosci,
  formatujCzas,
  formatujDystans,
} from "@/lib/wies/pobierz-aktywnosci-fitness-wsi";
import { bazowyUrlWitryny } from "@/lib/wies/kody-embed-wsi";

function escapeCsv(val: string): string {
  if (/[",\n\r]/.test(val)) return `"${val.replace(/"/g, '""')}"`;
  return val;
}

export function urlCsvAktywnosciFitnessWsi(villageId: string): string {
  return `${bazowyUrlWitryny()}/api/wies/${villageId}/sport/aktywnosc/csv`;
}

export function zbudujCsvAktywnosciFitnessWsi(aktywnosci: AktywnoscFitnessPubliczna[]): string {
  const naglowek = [
    "data",
    "godzina",
    "tytul",
    "rodzaj",
    "dystans",
    "czas",
    "autor",
    "klub",
    "zrodlo",
    "notatka",
  ].join(";");

  const wiersze = aktywnosci.map((a) => {
    const dt = new Date(a.activity_date);
    const data = dt.toLocaleDateString("pl-PL");
    const godzina = dt.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
    const zrodlo =
      a.source === "gpx"
        ? "GPX"
        : a.source === "strava_link" || a.source === "strava_oauth"
          ? "Strava"
          : "recznie";
    return [
      data,
      godzina,
      a.title,
      etykietaRodzajuAktywnosci(a.activity_kind),
      formatujDystans(a.distance_meters) ?? "",
      formatujCzas(a.duration_seconds) ?? "",
      a.autor?.display_name ?? "",
      a.nazwa_klubu ?? "",
      zrodlo,
      a.notes ?? "",
    ]
      .map((c) => escapeCsv(String(c)))
      .join(";");
  });

  return `\uFEFF${naglowek}\n${wiersze.join("\n")}\n`;
}
