/** Wywnioskowanie rodzaju aktywności z tytułu (Strava, GPX, ręczny opis). */
export type RodzajAktywnosci = "bieg" | "nordic_walking" | "rower" | "turystyka" | "inne";

export function wywnioskujRodzajAktywnosci(tekst: string): RodzajAktywnosci | null {
  const n = tekst.toLowerCase();
  if (
    n.includes("nordic") ||
    n.includes("nordic walking") ||
    n.includes("marsz z kijk") ||
    n.includes("kijki")
  ) {
    return "nordic_walking";
  }
  if (
    n.includes("bieg") ||
    n.includes("run") ||
    n.includes("jog") ||
    n.includes("maraton") ||
    n.includes("parkrun")
  ) {
    return "bieg";
  }
  if (
    n.includes("rower") ||
    n.includes("bike") ||
    n.includes("cycling") ||
    n.includes("mtb") ||
    n.includes("kolar")
  ) {
    return "rower";
  }
  if (
    n.includes("turyst") ||
    n.includes("wędr") ||
    n.includes("wedr") ||
    n.includes("hike") ||
    n.includes("spacer") ||
    (n.includes("walk") && !n.includes("nordic"))
  ) {
    return "turystyka";
  }
  return null;
}

export function polaczRodzajAktywnosci(
  wybrany: RodzajAktywnosci,
  tytul: string,
): RodzajAktywnosci {
  if (wybrany !== "inne") return wybrany;
  return wywnioskujRodzajAktywnosci(tytul) ?? "inne";
}
