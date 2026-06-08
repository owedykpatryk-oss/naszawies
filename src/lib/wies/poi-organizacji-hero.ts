import type { ZnacznikPoi } from "@/components/mapa/mapa-wsi-leaflet";
import {
  segmentDlaOrganizacji,
  type SegmentOrganizacji,
} from "@/lib/wies/sciezka-organizacji-publicznej";

export type HeroMapaOrganizacji = {
  lat: number;
  lng: number;
  linkPelnaMapa: string;
  etykietaLink: string;
  wariant: "parafia" | "osp" | "sport" | "kgw" | "rolnicy";
  nazwaMiejsca?: string | null;
  /** Dodatkowe pinezki (np. cmentarz obok kościoła). */
  dodatkowePiny?: HeroMapaDodatkowyPin[];
};

export type HeroMapaDodatkowyPin = {
  lat: number;
  lng: number;
  kolor: string;
  fill: string;
  nazwa: string;
  link?: string;
};

export type LinkiMapyOrganizacji = {
  linkKosciolNaMapie?: string | null;
  linkCmentarzNaMapie?: string | null;
  linkRemizaNaMapie?: string | null;
  linkBoiskoNaMapie?: string | null;
  linkMiejsceNaMapie?: string | null;
};

const HERO_KATEGORIE: Record<Exclude<SegmentOrganizacji, "lowiectwo">, string[]> = {
  parafia: ["kosciol"],
  osp: ["osp"],
  sport: ["boisko", "hala_sportowa"],
  kgw: ["swietlica", "dom_kultury"],
  szkola: ["szkola"],
  rolnicy: ["sklep_rolniczy", "zagroda"],
};

function poiPoKategorii(pois: ZnacznikPoi[], kategoria: string): ZnacznikPoi | null {
  const znaleziony = pois.find((p) => p.category === kategoria);
  if (!znaleziony || !Number.isFinite(znaleziony.lat) || !Number.isFinite(znaleziony.lon)) return null;
  return znaleziony;
}

function pierwszyPoi(pois: ZnacznikPoi[], kategorie: string[]): ZnacznikPoi | null {
  for (const kat of kategorie) {
    const znaleziony = poiPoKategorii(pois, kat);
    if (znaleziony) return znaleziony;
  }
  return null;
}

function linkPoi(poi: ZnacznikPoi): string {
  return `/mapa/miejsce/${poi.id}`;
}

export function linkiMapyOrganizacji(
  segment: SegmentOrganizacji,
  pois: ZnacznikPoi[],
): LinkiMapyOrganizacji {
  if (segment === "lowiectwo") return {};

  const kosciol = poiPoKategorii(pois, "kosciol");
  const cmentarz = poiPoKategorii(pois, "cmentarz");
  const remiza = poiPoKategorii(pois, "osp");
  const boisko = poiPoKategorii(pois, "boisko") ?? poiPoKategorii(pois, "hala_sportowa");
  const spotkania = poiPoKategorii(pois, "swietlica") ?? poiPoKategorii(pois, "dom_kultury");

  switch (segment) {
    case "parafia":
      return {
        linkKosciolNaMapie: kosciol ? linkPoi(kosciol) : null,
        linkCmentarzNaMapie: cmentarz ? linkPoi(cmentarz) : null,
        linkMiejsceNaMapie: kosciol ? linkPoi(kosciol) : cmentarz ? linkPoi(cmentarz) : null,
      };
    case "osp":
      return {
        linkRemizaNaMapie: remiza ? linkPoi(remiza) : null,
        linkMiejsceNaMapie: remiza ? linkPoi(remiza) : null,
      };
    case "sport":
      return {
        linkBoiskoNaMapie: boisko ? linkPoi(boisko) : null,
        linkMiejsceNaMapie: boisko ? linkPoi(boisko) : null,
      };
    case "kgw":
      return {
        linkMiejsceNaMapie: spotkania ? linkPoi(spotkania) : null,
      };
    case "rolnicy": {
      const skup = poiPoKategorii(pois, "sklep_rolniczy") ?? poiPoKategorii(pois, "zagroda");
      return {
        linkMiejsceNaMapie: skup ? linkPoi(skup) : null,
      };
    }
    default:
      return {};
  }
}

export function heroMapaOrganizacji(
  segment: SegmentOrganizacji,
  pois: ZnacznikPoi[],
): HeroMapaOrganizacji | null {
  if (segment === "lowiectwo") return null;

  if (segment === "parafia") {
    const kosciol = poiPoKategorii(pois, "kosciol");
    const cmentarz = poiPoKategorii(pois, "cmentarz");
    const glowny = kosciol ?? cmentarz;
    if (!glowny) return null;

    const dodatkowePiny: HeroMapaDodatkowyPin[] = [];
    if (kosciol && cmentarz && kosciol.id !== cmentarz.id) {
      const drugi = glowny === kosciol ? cmentarz : kosciol;
      const toKosciol = drugi === kosciol;
      dodatkowePiny.push({
        lat: drugi.lat,
        lng: drugi.lon,
        kolor: toKosciol ? "#5b21b6" : "#57534e",
        fill: toKosciol ? "#a78bfa" : "#a8a29e",
        nazwa: drugi.name ?? (toKosciol ? "Kościół" : "Cmentarz"),
        link: linkPoi(drugi),
      });
    }

    const toKosciol = glowny === kosciol;
    return {
      lat: glowny.lat,
      lng: glowny.lon,
      linkPelnaMapa: linkPoi(glowny),
      etykietaLink: toKosciol ? "Kościół na mapie ↗" : "Cmentarz na mapie ↗",
      wariant: "parafia",
      nazwaMiejsca: glowny.name,
      dodatkowePiny: dodatkowePiny.length > 0 ? dodatkowePiny : undefined,
    };
  }

  const kategorie = HERO_KATEGORIE[segment as Exclude<SegmentOrganizacji, "lowiectwo">];
  if (!kategorie) return null;

  const poi = pierwszyPoi(pois, kategorie);
  if (!poi) return null;

  const etykiety: Record<HeroMapaOrganizacji["wariant"], string> = {
    parafia: "Kościół na mapie ↗",
    osp: "Remiza na mapie ↗",
    sport: "Boisko na mapie ↗",
    kgw: "Miejsce spotkań na mapie ↗",
    rolnicy: "Skup / gospodarstwo na mapie ↗",
  };

  return {
    lat: poi.lat,
    lng: poi.lon,
    linkPelnaMapa: linkPoi(poi),
    etykietaLink: etykiety[segment as HeroMapaOrganizacji["wariant"]],
    wariant: segment as HeroMapaOrganizacji["wariant"],
    nazwaMiejsca: poi.name,
  };
}

export function segmentOrganizacjiZGrupy(groupType: string, name: string): SegmentOrganizacji | null {
  return segmentDlaOrganizacji(groupType, name);
}
