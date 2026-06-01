const ETYKIETY_ZRODLA_POI: Record<string, string> = {
  manual: "Ręczna",
  local_corrected: "Skorygowana",
  osm_auto: "OSM (auto)",
  geoportal: "Urzędowa (Geoportal)",
  nazwa_geo: "Urzędowa (PRNG)",
};

export type SzczegolyZrodlaPoi = {
  tekst: string;
  klasy: string;
  wymagaWeryfikacji: boolean;
};

export function etykietaZrodlaPoi(source: string | null | undefined): string {
  if (!source) return "Nieznane";
  return ETYKIETY_ZRODLA_POI[source] ?? source;
}

export function opisZrodlaPoi(poi: {
  source: string | null | undefined;
  verified_at?: string | null;
  is_local_override?: boolean | null;
}): SzczegolyZrodlaPoi {
  const src = poi.source ?? "";
  const etykieta = etykietaZrodlaPoi(src);
  const zweryfikowana = Boolean(poi.verified_at?.trim());
  const lokalna = Boolean(poi.is_local_override);

  if (lokalna) {
    return {
      tekst: `${etykieta} · poprawka sołtysa`,
      klasy: "bg-emerald-100 text-emerald-900",
      wymagaWeryfikacji: false,
    };
  }
  if (src === "geoportal" || src === "nazwa_geo") {
    return {
      tekst: `${etykieta} · dane urzędowe`,
      klasy: "bg-violet-100 text-violet-900",
      wymagaWeryfikacji: false,
    };
  }
  if (src === "osm_auto" && !zweryfikowana) {
    return {
      tekst: `${etykieta} · do weryfikacji`,
      klasy: "bg-amber-100 text-amber-950",
      wymagaWeryfikacji: true,
    };
  }
  return {
    tekst: zweryfikowana ? `${etykieta} · zweryfikowana` : etykieta,
    klasy: "bg-stone-100 text-stone-800",
    wymagaWeryfikacji: false,
  };
}

export function czyPoiUsuwalnaZeEdytora(source: string | null | undefined): boolean {
  const src = source ?? "";
  return src !== "geoportal" && src !== "nazwa_geo";
}
