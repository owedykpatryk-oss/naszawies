/** Etykieta źródła punktu na mapie (publiczny widok). */
export function etykietaZrodlaPoi(args: {
  source: string | null;
  verified_at: string | null;
  is_local_override: boolean | null;
}): { tekst: string; wymagaWeryfikacji: boolean; klasy: string } {
  const src = (args.source ?? "").trim();
  const wymaga =
    !args.verified_at &&
    args.is_local_override !== true &&
    (src === "osm_auto" || src === "geoportal");

  if (wymaga) {
    return {
      tekst: src === "geoportal" ? "Geoportal — do weryfikacji" : "OSM — do weryfikacji",
      wymagaWeryfikacji: true,
      klasy: "border-amber-300 bg-amber-50 text-amber-900",
    };
  }

  if (src === "osm_auto" || src === "geoportal") {
    return {
      tekst: src === "geoportal" ? "Geoportal" : "OpenStreetMap",
      wymagaWeryfikacji: false,
      klasy: "border-stone-200 bg-stone-50 text-stone-600",
    };
  }

  if (src === "local_corrected") {
    return {
      tekst: "Zweryfikowane lokalnie",
      wymagaWeryfikacji: false,
      klasy: "border-emerald-200 bg-emerald-50 text-emerald-800",
    };
  }

  return {
    tekst: "Dodane przez społeczność",
    wymagaWeryfikacji: false,
    klasy: "border-sky-200 bg-sky-50 text-sky-800",
  };
}
