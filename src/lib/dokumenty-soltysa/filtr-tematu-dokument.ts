import type { PresetDokumentu } from "./typy";

export type FiltrTematuDokumentu = "wszystkie" | "dzieci" | "swietlica";

export const ETYKIETY_TEMATU_DOK: Record<FiltrTematuDokumentu, string> = {
  wszystkie: "Wszystkie",
  dzieci: "Dzieci / szkoła",
  swietlica: "Świetlica",
};

export function presetPasujeDoTematuDok(p: PresetDokumentu, temat: FiltrTematuDokumentu): boolean {
  if (temat === "wszystkie") return true;
  const paczka = [p.tytul, p.opis, p.kategoria, p.id].join(" ").toLowerCase();
  if (temat === "dzieci") {
    return /dzieci|dziecko|szkoł|konkurs plast|dzień dziecka/.test(paczka);
  }
  if (temat === "swietlica") {
    return /świetlic|swietlic|regulamin|rezerwacj|sali/.test(paczka);
  }
  return true;
}
