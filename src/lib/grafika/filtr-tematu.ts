import type { SzablonGrafiki } from "./typy";

export type FiltrTematuGrafiki = "wszystkie" | "dzieci" | "swietlica" | "sezon" | "festyn" | "informacja" | "wow";

export const ETYKIETY_TEMATU: Record<FiltrTematuGrafiki, string> = {
  wszystkie: "Wszystkie tematy",
  dzieci: "Dzieci",
  swietlica: "Świetlica",
  sezon: "Sezon / święta",
  festyn: "Festyn / kiermasz",
  informacja: "Tablica / info",
  wow: "Premium / WOW",
};

export function szablonPasujeDoTematu(s: SzablonGrafiki, temat: FiltrTematuGrafiki): boolean {
  if (temat === "wszystkie") return true;
  const tagi = (s.tagi ?? []).map((t) => t.toLowerCase());
  const id = s.id.toLowerCase();

  switch (temat) {
    case "dzieci":
      return (
        tagi.some((t) => t.includes("dzieci") || t.includes("dzień dziecka")) ||
        id.includes("dziecko") ||
        id.includes("dzieci")
      );
    case "swietlica":
      return (
        tagi.some((t) => t.includes("świetlica") || t.includes("regulamin")) ||
        id.includes("swietlic")
      );
    case "sezon":
      return tagi.includes("sezon") || id.startsWith("sezon-") || tagi.some((t) => t.includes("święta") || t.includes("patriot"));
    case "festyn":
      return (
        tagi.some((t) => t.includes("festyn") || t.includes("kiermasz") || t.includes("dożynki") || t.includes("program")) ||
        id.includes("festyn") ||
        id.includes("dozynki") ||
        id.includes("kiermasz")
      );
    case "informacja":
      return (
        tagi.includes("informacja") ||
        tagi.includes("zebranie") ||
        tagi.includes("kontakt") ||
        tagi.includes("fundusz") ||
        tagi.includes("inwestycja") ||
        s.layout === "plakat-ogloszenie" ||
        id.includes("tablica") ||
        id.includes("fundusz") ||
        id.includes("kontakt")
      );
    case "wow":
      return (
        tagi.includes("wow") ||
        s.layout === "dyplom-pergamin" ||
        s.layout === "dyplom-medal" ||
        s.layout === "plakat-dzieci"
      );
    default:
      return true;
  }
}
