export type PolePresetu = {
  id: string;
  etykieta: string;
  typ: "text" | "textarea" | "date";
  /** Domyślna wartość pola (np. dzisiejsza data) */
  domyslna?: string;
  placeholder?: string;
  wiersze?: number;
  podpowiedz?: string;
};

export type PresetDokumentu = {
  id: string;
  kategoria: string;
  tytul: string;
  opis: string;
  pola: PolePresetu[];
  /** Wartości z formularza (surowe) → bezpieczny HTML dokumentu */
  budujHtml: (
    wartosci: Record<string, string>,
    meta: {
      dataWygenerowania: string;
      stanNaDzien?: string;
      /** Unikalny identyfikator wydruku (np. archiwum skanów) */
      numerReferencyjny?: string;
      /** Jedna linia, np. „Sołectwo X · gmina Y” */
      kontekstSolectwa?: string;
      /** Imię i nazwisko z profilu naszawies.pl */
      wygenerowalNazwa?: string;
    }
  ) => string;
};

/** Opcje przekazywane z panelu sołtysa — wstawiane tylko w puste pola. */
export type OpcjeDomyslneGeneratoraSoltysa = {
  domyslnaWies?: string;
  domyslnaGmina?: string;
  /** Zwykle display_name z tabeli users */
  domyslnySoltysNazwa?: string;
};

/** Wieś z roli sołtysa — wybór w generatorze przy wielu sołectwach. */
export type SolectwoDlaGeneratoraDokumentow = {
  villageId: string;
  nazwa: string;
  gmina: string;
};
