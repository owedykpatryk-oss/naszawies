export type ZakladkaKreatora = "szablon" | "edycja" | "eksport";

export type TrybPracyGrafiki = "zaproszenie" | "dyplomy" | "edytor";

export const ZAKLADKI_KREATORA: {
  id: ZakladkaKreatora;
  tytul: string;
  opis: string;
  ikona: string;
}[] = [
  {
    id: "szablon",
    tytul: "Szablon",
    opis: "Gotowe projekty i skróty WOW",
    ikona: "📋",
  },
  {
    id: "edycja",
    tytul: "Treść i wygląd",
    opis: "Pola, kolory, logo, QR",
    ikona: "✏️",
  },
  {
    id: "eksport",
    tytul: "Pobierz i opublikuj",
    opis: "PDF, social, e-mail, profil wsi",
    ikona: "📥",
  },
];

export const TRYBY_PRACY: {
  id: TrybPracyGrafiki;
  tytul: string;
  opis: string;
  ikona: string;
}[] = [
  {
    id: "zaproszenie",
    tytul: "Zaproszenie lub plakat",
    opis: "Najprostsza droga — 3 zakładki u góry.",
    ikona: "✉",
  },
  {
    id: "dyplomy",
    tytul: "Wiele dyplomów naraz",
    opis: "Lista imion → osobny PDF dla każdej osoby.",
    ikona: "📜",
  },
  {
    id: "edytor",
    tytul: "Edytor zaawansowany",
    opis: "Opcjonalnie: przeciąganie elementów.",
    ikona: "✎",
  },
];
