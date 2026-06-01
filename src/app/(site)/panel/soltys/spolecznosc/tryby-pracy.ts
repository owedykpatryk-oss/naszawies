type GrupaDoFiltrowania = {
  id: string;
  village_id: string;
  group_type: string;
  name: string;
};

import { czyOrganizacjaSport } from "@/lib/wies/sport";

export type TrybOrganizacji = "ogolny" | "kgw" | "osp" | "parafia" | "mysliwi" | "szkola" | "sport";

export const TRYBY_PRACY_OPCJE: ReadonlyArray<{ id: TrybOrganizacji; label: string }> = [
  { id: "ogolny", label: "Ogólny (cała wieś)" },
  { id: "parafia", label: "Parafia" },
  { id: "szkola", label: "Szkoła / przedszkole" },
  { id: "sport", label: "Klub sportowy" },
  { id: "kgw", label: "KGW" },
  { id: "mysliwi", label: "Myśliwi" },
  { id: "osp", label: "OSP" },
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
  sport: {
    tytul: "Tryb sportu — kolejność działań",
    kroki: [
      "Dodaj klub (typ „sport”) z boiskiem, kontaktem i opisem sekcji.",
      "W planie tygodnia wpisz stałe treningi — widoczne w zakładce Sport.",
      "Dodaj mecze i zawody do kalendarza (rodzaj: mecz / próba / wyjazd).",
    ],
  },
  osp: {
    tytul: "Tryb OSP — kolejność działań",
    kroki: [
      "Dodaj jednostkę OSP i przypisz osobę kontaktową.",
      "Opublikuj najbliższe ćwiczenia oraz stały plan tygodnia.",
      "Dodaj komunikat bezpieczeństwa dla mieszkańców z krótkimi zaleceniami.",
    ],
  },
  szkola: {
    tytul: "Tryb szkoły — kolejność działań",
    kroki: [
      "Uzupełnij profil placówki: dyrekcja, adres, godziny przyjęć rodziców.",
      "Włącz moduł „Szkoła” w wyglądzie profilu wsi i dodaj pinezkę szkoły na mapie.",
      "Publikuj ogłoszenia na tablicy (rodzice, klasy) w panelu tablicy szkoły.",
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
  if (tryb === "szkola") return "szkola";
  if (tryb === "sport") return "sport";
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
    if (tryb === "szkola")
      return g.group_type === "szkola" || g.name.toLowerCase().includes("szkoł") || g.name.toLowerCase().includes("przedszkol");
    if (tryb === "sport") return czyOrganizacjaSport(g.group_type, g.name);
    return (
      (g.group_type === "osp" || g.name.toLowerCase().includes("osp")) &&
      !czyOrganizacjaSport(g.group_type, g.name)
    );
  });
}
