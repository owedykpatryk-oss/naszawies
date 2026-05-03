type GrupaDoFiltrowania = {
  id: string;
  village_id: string;
  group_type: string;
  name: string;
};

export type TrybOrganizacji = "ogolny" | "kgw" | "osp";

export const TRYBY_PRACY_OPCJE: ReadonlyArray<{ id: TrybOrganizacji; label: string }> = [
  { id: "ogolny", label: "Ogólny (cała wieś)" },
  { id: "kgw", label: "KGW" },
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
  kgw: {
    tytul: "Tryb KGW — kolejność działań",
    kroki: [
      "Dodaj lub zaktualizuj grupę KGW i kontakt.",
      "Uzupełnij harmonogram cyklicznych spotkań i wydarzenia kwartalne.",
      "Dodaj listę zakupów i wpis o dofinansowaniu pod najbliższą inicjatywę.",
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

export function domyslnyTypGrupyDlaTrybu(tryb: TrybOrganizacji): string {
  if (tryb === "kgw") return "kgw";
  if (tryb === "osp") return "osp";
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
    if (tryb === "kgw") return g.group_type === "kgw" || g.name.toLowerCase().includes("kgw");
    return g.group_type === "osp" || g.group_type === "sport" || g.name.toLowerCase().includes("osp");
  });
}
