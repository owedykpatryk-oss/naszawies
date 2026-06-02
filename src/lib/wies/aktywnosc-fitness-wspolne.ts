export type AktywnoscFitnessPubliczna = {
  id: string;
  activity_kind: string;
  title: string;
  activity_date: string;
  duration_seconds: number | null;
  distance_meters: number | null;
  source: string;
  strava_url: string | null;
  notes: string | null;
  autor: { id: string; display_name: string | null } | null;
  nazwa_klubu: string | null;
};

export type PodsumowanieAktywnosciFitness = {
  liczbaAktywnosci: number;
  lacznyDystansMetrow: number;
  uczestnikow: number;
  okres: "miesiac";
};

export function formatujDystans(metry: number | null): string | null {
  if (metry == null || metry <= 0) return null;
  if (metry >= 1000) return `${(metry / 1000).toFixed(metry >= 10000 ? 1 : 2)} km`;
  return `${metry} m`;
}

export function formatujCzas(sekundy: number | null): string | null {
  if (sekundy == null || sekundy <= 0) return null;
  const h = Math.floor(sekundy / 3600);
  const m = Math.floor((sekundy % 3600) / 60);
  const s = sekundy % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const ETYKIETY_AKTYWNOSCI: Record<string, string> = {
  bieg: "Bieg",
  nordic_walking: "Nordic walking",
  rower: "Rower",
  turystyka: "Turystyka",
  inne: "Aktywność",
};

export function etykietaRodzajuAktywnosci(kod: string): string {
  return ETYKIETY_AKTYWNOSCI[kod] ?? kod;
}
