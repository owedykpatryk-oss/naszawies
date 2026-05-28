type GrupaDoFiltrowania = {
  id: string;
  village_id: string;
  group_type: string;
  name: string;
};

export type TrybOrganizacji = "ogolny" | "kgw" | "osp" | "parafia" | "mysliwi";

export const TRYBY_PRACY_OPCJE: ReadonlyArray<{ id: TrybOrganizacji; label: string }> = [
  { id: "ogolny", label: "Ogólny (cała wieś)" },
  { id: "parafia", label: "Parafia" },
  { id: "kgw", label: "KGW" },
  { id: "mysliwi", label: "Myśliwi" },
  { id: "osp", label: "OSP / sport" },
];

export const KOLEJNOSC_DZIALAN_TRYBU: Record<TrybOrganizacji, { tytul: string; kroki: string[] }> = {
  ogolny: {
    tytul: "Tryb ogólny — kolejność działań",
    kroki: [
      "Najpierw organizacje, potem wydarzenia i harmonogram tygodnia.",
      "Następnie wiadomości lokalne i wpisy blog/historia dla ruchu na profilu.",
      "Na końcu uruchom automatyzacje porządkowe.",
    ],
  },
  parafia: {
    tytul: "Tryb parafii — kolejność działań",
    kroki: [
      "Uzupełnij profil parafii: msze, spowiedź, kancelaria i kontakt proboszcza.",
      "Dodaj wydarzenia liturgiczne (pielgrzymka, rekolekcje, katecheza).",
      "W planie tygodnia wpisz stałe grupy (schola, ministranci, rada parafialna).",
    ],
  },
  kgw: {
    tytul: "Tryb KGW — kolejność działań",
    kroki: [
      "Uzupełnij profil KGW: przewodnicząca, zebrania, miejsce spotkań i jak dołączyć.",
      "Dodaj wydarzenia (kiermasz, warsztaty, zebranie) do kalendarza wsi.",
      "Uzupełnij plan tygodnia i listę zakupów — pomaga w organizacji imprez.",
    ],
  },
  mysliwi: {
    tytul: "Tryb myśliwych — kolejność działań",
    kroki: [
      "Uzupełnij profil koła: prezes, łowczy, obwód i zasady bezpieczeństwa.",
      "Opublikuj ostrzeżenie polowania w module Polowania (rejon + terminy).",
      "Dodaj wydarzenia (Hubertus, zebranie, szkolenie) do kalendarza wsi.",
    ],
  },
  osp: {
    tytul: "Tryb OSP / sport — kolejność działań",
    kroki: [
      "Dodaj grupę OSP/sport i przypisz osobę kontaktową.",
      "Opublikuj najbliższe ćwiczenia / mecze oraz stałe treningi tygodniowe.",
      "Dodaj komunikat bezpieczeństwa dla mieszkańców z krótkimi zaleceniami.",
    ],
  },
};

function nazwaSugerujeLowiectwo(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("łow") || n.includes("low") || n.includes("myśliw") || n.includes("mysliw");
}

export function domyslnyTypGrupyDlaTrybu(tryb: TrybOrganizacji): string {
  if (tryb === "kgw") return "kgw";
  if (tryb === "osp") return "osp";
  if (tryb === "parafia") return "parafia";
  if (tryb === "mysliwi") return "lowiectwo";
  return "inne";
}

export function filtrujGrupyDlaTrybu(
  grupy: GrupaDoFiltrowania[],
  villageId: string,
  tryb: TrybOrganizacji,
): GrupaDoFiltrowania[] {
  return grupy.filter((g) => {
    if (g.village_id !== villageId) return false;
    if (tryb === "ogolny") return true;
    if (tryb === "parafia") return g.group_type === "parafia" || g.name.toLowerCase().includes("parafia");
    if (tryb === "kgw") return g.group_type === "kgw" || g.name.toLowerCase().includes("kgw");
    if (tryb === "mysliwi")
      return g.group_type === "lowiectwo" || (g.group_type === "kolo" && nazwaSugerujeLowiectwo(g.name));
    return g.group_type === "osp" || g.group_type === "sport" || g.name.toLowerCase().includes("osp");
  });
}
