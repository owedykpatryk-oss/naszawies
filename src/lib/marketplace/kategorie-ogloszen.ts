export const TYPY_OGLOSZEN = [
  { value: "sprzedam", label: "Sprzedam" },
  { value: "kupie", label: "Kupię / szukam" },
  { value: "wynajme", label: "Wynajmę (oddaję w najem)" },
  { value: "wypozycze", label: "Wypożyczę (oddaję sprzęt)" },
  { value: "usluga", label: "Oferuję usługę" },
  { value: "oddam", label: "Oddam" },
  { value: "praca", label: "Praca / zlecenie" },
] as const;

export type TypOgloszenia = (typeof TYPY_OGLOSZEN)[number]["value"];

export type WierszKategoriiRynku = { value: string; label: string };

export type GrupaKategoriiRynku = {
  id: string;
  label: string;
  items: WierszKategoriiRynku[];
};

/** Grupy kategorii — sprzęt, produkty z gospodarstwa, zwierzęta, usługi. */
export const GRUPY_KATEGORII_RYNKU: GrupaKategoriiRynku[] = [
  {
    id: "produkty_lokalne",
    label: "Produkty lokalne (jedzenie)",
    items: [
      { value: "miod", label: "Miód, pyłek, wosk pszczeli" },
      { value: "sery_nabial", label: "Sery, nabiał, masło, jaja" },
      { value: "mieso_wedliny", label: "Mięso, drób, wędliny" },
      { value: "warzywa_owoce", label: "Warzywa, owoce, ziemniaki" },
      { value: "pieczywo", label: "Pieczywo, ciasta, wypieki" },
      { value: "przetwory", label: "Przetwory, dżemy, kiszonki, soki" },
      { value: "ziarno_maka", label: "Zboże, mąka, kasze, orzechy" },
      { value: "napoje_lokalne", label: "Soki, syropy, napoje lokalne" },
      { value: "inne_jedzenie", label: "Inne produkty spożywcze" },
    ],
  },
  {
    id: "maszyny",
    label: "Maszyny i pojazdy",
    items: [
      { value: "ciagnik", label: "Ciągnik / maszyna ciągnąca" },
      { value: "kombajn", label: "Kombajn / żniwiarka" },
      { value: "maszyna_rolnicza", label: "Inna maszyna rolnicza" },
      { value: "pojazd", label: "Pojazd / przyczepa" },
      { value: "narzedzia", label: "Narzędzia / drobny sprzęt" },
    ],
  },
  {
    id: "zwierzeta",
    label: "Zwierzęta",
    items: [{ value: "konie", label: "Konie / zwierzęta gospodarskie" }],
  },
  {
    id: "uslugi",
    label: "Usługi i inne",
    items: [
      { value: "usluga_z_operatorem", label: "Usługa z operatorem (np. za godzinę)" },
      { value: "inne", label: "Inne" },
    ],
  },
];

/** Spłaszczona lista (bez pustej opcji). */
export const KATEGORIE_OGLOSZEN: WierszKategoriiRynku[] = GRUPY_KATEGORII_RYNKU.flatMap((g) => g.items);

/** @deprecated Użyj KATEGORIE_OGLOSZEN — zachowane dla istniejących importów. */
export const KATEGORIE_SPRZETU = [
  { value: "", label: "— wybierz kategorię —" },
  ...KATEGORIE_OGLOSZEN,
] as const;

export const WARTOSCI_PRODUKTY_LOKALNE: Set<string> = new Set(
  GRUPY_KATEGORII_RYNKU.find((g) => g.id === "produkty_lokalne")!.items.map((i) => i.value),
);

export const JEDNOSTKI_CENY = [
  { value: "", label: "Do ustalenia" },
  { value: "kg", label: "za kg" },
  { value: "litr", label: "za litr" },
  { value: "sztuka", label: "za sztukę / opakowanie" },
  { value: "sloik", label: "za słoik / pojemnik" },
  { value: "godzina", label: "za godzinę" },
  { value: "dzien", label: "za dzień" },
  { value: "usluga", label: "za usługę" },
  { value: "ustalenie", label: "cena do uzgodnienia" },
] as const;

export function etykietaTypuOgloszenia(typ: string) {
  return TYPY_OGLOSZEN.find((t) => t.value === typ)?.label ?? typ;
}

export function etykietaKategoriiOgloszenia(k: string | null | undefined) {
  if (!k) return null;
  return KATEGORIE_OGLOSZEN.find((x) => x.value === k)?.label ?? k;
}

/** @deprecated alias */
export function etykietaKategoriiSprzetu(k: string | null | undefined) {
  return etykietaKategoriiOgloszenia(k);
}

export function etykietaJednostkiCeny(j: string | null | undefined) {
  if (!j) return null;
  return JEDNOSTKI_CENY.find((x) => x.value === j)?.label ?? j;
}

export function czyKategoriaProduktuLokalnego(k: string | null | undefined): boolean {
  return !!k && WARTOSCI_PRODUKTY_LOKALNE.has(k);
}

/** Podpowiedź tytułu po wyborze typu + kategorii */
export function podpowiedzTytulu(typ: string, kat: string, zOperatorem: boolean): string {
  if (typ === "sprzedam" && kat === "miod") return "Sprzedam miód z własnej pasieki — …";
  if (typ === "kupie" && kat === "miod") return "Kupię miód / szukam od pszczelarza — …";
  if (typ === "sprzedam" && kat === "sery_nabial") return "Sprzedam sery / nabiał z gospodarstwa — …";
  if (typ === "sprzedam" && kat === "mieso_wedliny") return "Sprzedam mięso / wędliny — …";
  if (typ === "sprzedam" && kat === "warzywa_owoce") return "Sprzedam warzywa / owoce — …";
  if (typ === "sprzedam" && kat === "przetwory") return "Sprzedam przetwory domowe — …";
  if (typ === "sprzedam" && kat === "ciagnik") return "Sprzedam ciągnik — …";
  if (typ === "kupie" && kat === "ciagnik") return "Kupię / szukam ciągnika — …";
  if (typ === "sprzedam" && kat === "kombajn") return "Sprzedam kombajn — …";
  if (typ === "kupie" && kat === "konie") return "Kupię konia / klacz — …";
  if (typ === "sprzedam" && kat === "konie") return "Sprzedam konia — …";
  if (typ === "wynajme" && zOperatorem) return "Wynajmę … z operatorem (za godzinę)";
  if (typ === "wynajme") return "Wynajmę …";
  if (typ === "wypozycze") return "Wypożyczę …";
  if (typ === "usluga" && kat === "usluga_z_operatorem") return "Usługa z operatorem — …";
  const k = etykietaKategoriiOgloszenia(kat);
  if (k && typ === "kupie") return `Kupię / szukam: ${k} — …`;
  if (k && typ === "sprzedam") return `Sprzedam: ${k} — …`;
  return "";
}

/** Domyślna jednostka ceny po kategorii (opcjonalnie w formularzu). */
export function domyslnaJednostkaCeny(kat: string): string {
  if (WARTOSCI_PRODUKTY_LOKALNE.has(kat)) {
    if (kat === "miod" || kat === "przetwory" || kat === "napoje_lokalne") return "sloik";
    if (kat === "sery_nabial" || kat === "mieso_wedliny" || kat === "warzywa_owoce" || kat === "ziarno_maka")
      return "kg";
    return "sztuka";
  }
  if (kat === "ciagnik" || kat === "kombajn" || kat === "usluga_z_operatorem") return "godzina";
  return "";
}
