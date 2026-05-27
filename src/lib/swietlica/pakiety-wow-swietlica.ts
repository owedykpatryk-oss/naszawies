import type { AkcjaInwentarza } from "@/lib/swietlica/inwentarz-status";

export type PozycjaPakietuWow = {
  category: string;
  name: string;
  quantity: number;
  condition: string;
  description: string;
  inventory_action: AkcjaInwentarza;
  width_cm?: number;
  length_cm?: number;
  height_cm?: number;
};

/** Gotowe propozycje wyposażenia z efektem WOW — sołtys dodaje jednym kliknięciem jako plan. */
export const PAKIET_WOW_SWIETLICA: PozycjaPakietuWow[] = [
  {
    category: "Technika — plan WOW",
    name: "Projektor Full HD + ekran 2,5 m",
    quantity: 1,
    condition: "good",
    inventory_action: "wishlist_wow",
    description:
      "Kino wiejskie, slajdy z fotokroniki, wykłady — efekt „nowoczesna świetlica” bez wychodzenia z budynku.",
    width_cm: 300,
    length_cm: 40,
    height_cm: 25,
  },
  {
    category: "Technika — plan WOW",
    name: "Nagłośnienie mobilne + 2 mikrofony bezprzewodowe",
    quantity: 1,
    condition: "good",
    inventory_action: "wishlist_wow",
    description: "Koncerty KGW, jasełka, dyskoteki seniorów — głośno i czytelnie na całą salę.",
    width_cm: 45,
    length_cm: 35,
    height_cm: 70,
  },
  {
    category: "Technika — plan WOW",
    name: "Interaktywny panel 65″ (smart tablica)",
    quantity: 1,
    condition: "good",
    inventory_action: "wishlist_wow",
    description: "Warsztaty dla dzieci, szkolenia OSP, spotkania z urzędem — rysowanie i prezentacje na żywo.",
    width_cm: 145,
    length_cm: 9,
    height_cm: 90,
  },
  {
    category: "Oświetlenie — plan WOW",
    name: "Zestaw oświetlenia imprezowego LED (PAR + sterownik)",
    quantity: 1,
    condition: "good",
    inventory_action: "wishlist_wow",
    description: "Andrzejki, sylwester, festyn w sali — klimat jak na dużej imprezie.",
    width_cm: 60,
    length_cm: 40,
    height_cm: 30,
  },
  {
    category: "Zaplecze — plan WOW",
    name: "Ekspres do kawy gastronomiczny + młynek",
    quantity: 1,
    condition: "good",
    inventory_action: "wishlist_wow",
    description: "Kawa na zebraniach i po mszy — drobny gest, który mieszkańcy pamiętają latami.",
    width_cm: 35,
    length_cm: 50,
    height_cm: 85,
  },
  {
    category: "Bezpieczeństwo — plan WOW",
    name: "AED (defibrylator) + szafka na ścianę",
    quantity: 1,
    condition: "good",
    inventory_action: "wishlist_wow",
    description: "Realny efekt WOW dla całej wsi — bezpieczeństwo na wydarzeniach masowych.",
    width_cm: 40,
    length_cm: 15,
    height_cm: 50,
  },
];
