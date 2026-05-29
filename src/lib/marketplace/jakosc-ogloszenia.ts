import { czyKategoriaNieruchomosci, czyKategoriaProduktuLokalnego } from "@/lib/marketplace/kategorie-ogloszen";

export type PoziomJakosci = "slaba" | "srednia" | "dobra" | "kompletna";

export type PozycjaChecklisty = {
  id: string;
  label: string;
  wskazowka: string;
  waga: number;
  spełnione: boolean;
  wazne?: boolean;
};

export type WynikJakosci = {
  procent: number;
  poziom: PoziomJakosci;
  punkty: number;
  maxPunkty: number;
  pozycje: PozycjaChecklisty[];
  slowaKluczowe: string[];
};

export type DaneJakosciOgloszenia = {
  kategoria: string;
  tytul: string;
  opis: string;
  cena: number | null;
  jednostkaCeny: string;
  telefon: string;
  miejsce: string;
  liczbaZdjec: number;
  zOperatorem?: boolean;
  geoportalParcelId?: string | null;
  parcelAreaM2?: number | null;
  parcelNumber?: string | null;
  pickupInVillage?: boolean;
  deliveryRadiusKm?: number | null;
  seasonalNote?: string;
  productProducedAt?: string;
  isOrganic?: boolean;
  latitude?: number | null;
};

/** Słowa kluczowe i wskazówki — pomagają trafić w filtry i wyszukiwarkę. */
export const WSKAZOWKI_KATEGORII: Record<
  string,
  { slowa: string[]; tytul: string; opis: string }
> = {
  miod: {
    slowa: ["miód", "pszczeli", "wielokwiatowy", "lipowy", "nawłociowy", "kg", "słoik"],
    tytul: "Np. „Miód wielokwiatowy z pasieki — słoik 900 g, odbiór we wsi”",
    opis: "Rodzaj miodu, wielkość opakowania, rok zbioru, czy pasteryzowany, możliwość odbioru / dowozu.",
  },
  sery_nabial: {
    slowa: ["ser", "kozi", "owczy", "jaja", "nabiał", "kg"],
    tytul: "Np. „Ser kozi dojrzewający — ok. 300 g, produkcja własna”",
    opis: "Rodzaj sera, waga, data produkcji, przechowywanie, odbiór osobisty.",
  },
  warzywa_owoce: {
    slowa: ["warzywa", "ziemniaki", "marchew", "jabłka", "sezon", "kg"],
    tytul: "Np. „Ziemniaki consumption — worki 25 kg, świeżo wykopane”",
    opis: "Odmiana, ilość, sezon dostępności, czy ekologiczne, miejsce odbioru.",
  },
  ciagnik: {
    slowa: ["ciągnik", "Ursus", "Zetor", "KM", "rok", "stan"],
    tytul: "Np. „Ciągnik Ursus C-360 — rok 1998, po remoncie silnika”",
    opis: "Marka, model, rok, przebieg/motogodziny, stan techniczny, wyposażenie, możliwość jazdy próbnej.",
  },
  dzialka_budowlana: {
    slowa: ["działka", "budowlana", "m²", "ar", "obręb", "media"],
    tytul: "Np. „Działka budowlana 1200 m² — media w granicy, mapa Geoportal”",
    opis: "Powierzchnia, numer działki, obręb, dostęp do drogi, media, MPZP jeśli znane.",
  },
  dzialka_rolna: {
    slowa: ["działka", "rolna", "ha", "ar", "grunt", "klasa"],
    tytul: "Np. „Działka rolna 1,2 ha — klasa IIIb, przy drodze asfaltowej”",
    opis: "Powierzchnia, klasa gleby, dostęp, czy rolna / siedliskowa, mapa z Geoportalu.",
  },
  dom_mieszkalny: {
    slowa: ["dom", "m²", "pokoje", "działka", "stan"],
    tytul: "Np. „Dom jednorodzinny 120 m² + działka 2000 m²”",
    opis: "Metraż, liczba pokoi, rok budowy, stan, ogrzewanie, media, dojazd.",
  },
  usluga_z_operatorem: {
    slowa: ["usługa", "operator", "godzina", "hektar", "maszyna"],
    tytul: "Np. „Orka z operatorem — ciągnik + brona, cena za godzinę”",
    opis: "Zakres usługi, sprzęt, stawka za godzinę/hektar, dostępne terminy, zasięg dojazdu.",
  },
};

const WSKAZOWKI_DOMYSLNE = {
  slowa: ["stan", "cena", "odbiór", "kontakt"],
  tytul: "Konkretny przedmiot + najważniejsza cecha (stan, ilość, rok).",
  opis: "Opisz stan, ilość, warunki odbioru i to, czego kupujący nie zobaczy na zdjęciu.",
};

export function wskazowkiKategorii(kat: string) {
  return WSKAZOWKI_KATEGORII[kat] ?? WSKAZOWKI_DOMYSLNE;
}

export function szablonOpisuKategorii(kat: string, zOperatorem: boolean): string {
  if (czyKategoriaProduktuLokalnego(kat)) {
    return [
      "• Produkt: …",
      "• Ilość / opakowanie: …",
      "• Data produkcji / zbioru: …",
      "• Odbiór: we wsi / dowóz do … km",
      "• Uwagi (np. ekologiczne, alergeny): …",
    ].join("\n");
  }
  if (czyKategoriaNieruchomosci(kat)) {
    return [
      "• Powierzchnia: … m²",
      "• Numer działki / obręb: …",
      "• Dostęp do drogi: …",
      "• Media (prąd, woda, kanalizacja): …",
      "• Dodatkowe informacje: …",
    ].join("\n");
  }
  if (kat === "ciagnik" || kat === "kombajn" || kat === "maszyna_rolnicza" || kat === "pojazd") {
    return [
      "• Marka / model: …",
      "• Rok produkcji: …",
      "• Stan techniczny: …",
      "• Przebieg / motogodziny: …",
      "• Wyposażenie / uwagi: …",
    ].join("\n");
  }
  if (kat === "usluga_z_operatorem" || zOperatorem) {
    return [
      "• Zakres usługi: …",
      "• Sprzęt: …",
      "• Stawka (godzina / hektar): …",
      "• Terminy: …",
      "• Zasięg dojazdu: … km",
    ].join("\n");
  }
  return [
    "• Opis przedmiotu: …",
    "• Stan: …",
    "• Cena / warunki: …",
    "• Odbiór / kontakt: …",
  ].join("\n");
}

function poziomZProcentu(p: number): PoziomJakosci {
  if (p >= 85) return "kompletna";
  if (p >= 65) return "dobra";
  if (p >= 40) return "srednia";
  return "slaba";
}

function maSlowoKluczowe(tytul: string, opis: string, slowa: string[]): boolean {
  const hay = `${tytul} ${opis}`.toLowerCase();
  return slowa.some((s) => hay.includes(s.toLowerCase()));
}

export function obliczJakoscOgloszenia(d: DaneJakosciOgloszenia): WynikJakosci {
  const wsk = wskazowkiKategorii(d.kategoria);
  const jedzenie = czyKategoriaProduktuLokalnego(d.kategoria);
  const nieruchomosc = czyKategoriaNieruchomosci(d.kategoria);

  const pozycje: PozycjaChecklisty[] = [
    {
      id: "kategoria",
      label: "Wybrana kategoria",
      wskazowka: "Dopasuj kategorię — inaczej ogłoszenie nie pojawi się w filtrach.",
      waga: 10,
      spełnione: d.kategoria.length > 0,
      wazne: true,
    },
    {
      id: "tytul",
      label: "Tytuł min. 15 znaków, konkretny",
      wskazowka: wsk.tytul,
      waga: 15,
      spełnione: d.tytul.trim().length >= 15,
      wazne: true,
    },
    {
      id: "slowa",
      label: "Słowa kluczowe w tytule lub opisie",
      wskazowka: `Dodaj np.: ${wsk.slowa.slice(0, 5).join(", ")}`,
      waga: 10,
      spełnione: maSlowoKluczowe(d.tytul, d.opis, wsk.slowa),
    },
    {
      id: "opis",
      label: "Opis min. 80 znaków",
      wskazowka: wsk.opis,
      waga: 15,
      spełnione: d.opis.trim().length >= 80,
      wazne: true,
    },
    {
      id: "zdjecie",
      label: "Co najmniej 1 zdjęcie",
      wskazowka: "Ogłoszenia ze zdjęciem dostają kilkukrotnie więcej zapytań.",
      waga: 15,
      spełnione: d.liczbaZdjec >= 1,
      wazne: true,
    },
    {
      id: "zdjecia2",
      label: "2+ zdjęcia (polecane)",
      wskazowka: "Pokaż detale, etykietę, numer seryjny lub widok z drugiej strony.",
      waga: 5,
      spełnione: d.liczbaZdjec >= 2,
    },
    {
      id: "cena",
      label: "Podana cena",
      wskazowka: "Nawet „do uzgodnienia” — wybierz jednostkę w formularzu.",
      waga: 10,
      spełnione: d.cena != null && d.cena > 0,
    },
    {
      id: "jednostka",
      label: "Jednostka ceny (kg, ha, godzina…)",
      wskazowka: "Ułatwia porównanie z innymi ogłoszeniami w kategorii.",
      waga: 5,
      spełnione: Boolean(d.jednostkaCeny?.trim()),
    },
    {
      id: "kontakt",
      label: "Telefon lub czat",
      wskazowka: "Telefon przyspiesza kontakt; czat działa dla zalogowanych sąsiadów.",
      waga: 8,
      spełnione: d.telefon.trim().length >= 9,
    },
    {
      id: "miejsce",
      label: "Miejsce / rejon odbioru",
      wskazowka: "Np. „centrum wsi”, „przy drodze do …”, „odbiór na posesji”.",
      waga: 7,
      spełnione: d.miejsce.trim().length >= 3,
    },
  ];

  if (jedzenie) {
    pozycje.push(
      {
        id: "sezon",
        label: "Sezon lub data produkcji",
        wskazowka: "Kupujący chcą wiedzieć, kiedy produkt powstał i jak długo jest świeży.",
        waga: 8,
        spełnione: Boolean(d.seasonalNote?.trim() || d.productProducedAt?.trim()),
      },
      {
        id: "odbior",
        label: "Odbiór we wsi lub dowóz",
        wskazowka: "Zaznacz odbiór osobisty albo podaj promień dowozu.",
        waga: 7,
        spełnione: Boolean(d.pickupInVillage || (d.deliveryRadiusKm != null && d.deliveryRadiusKm > 0)),
      },
    );
  }

  if (nieruchomosc) {
    pozycje.push(
      {
        id: "geoportal",
        label: "Mapa działki z Geoportalu",
        wskazowka: "Unikalna przewaga nad OLX/Otodom — kliknij działkę na mapie w formularzu.",
        waga: 15,
        spełnione: Boolean(d.geoportalParcelId?.trim()),
        wazne: true,
      },
      {
        id: "powierzchnia",
        label: "Powierzchnia w m²",
        wskazowka: "Uzupełnia się automatycznie z Geoportalu lub wpisz ręcznie.",
        waga: 8,
        spełnione: d.parcelAreaM2 != null && d.parcelAreaM2 > 0,
      },
      {
        id: "numer",
        label: "Numer działki / obręb",
        wskazowka: "Buduje zaufanie u kupujących nieruchomości.",
        waga: 5,
        spełnione: Boolean(d.parcelNumber?.trim()),
      },
    );
  }

  if (d.zOperatorem || d.kategoria === "usluga_z_operatorem") {
    pozycje.push({
      id: "operator",
      label: "Opis zakresu usługi z operatorem",
      wskazowka: "Podaj stawkę za godzinę/hektar i co wchodzi w skład usługi.",
      waga: 8,
      spełnione: d.opis.trim().length >= 100,
    });
  }

  const maxPunkty = pozycje.reduce((s, p) => s + p.waga, 0);
  const punkty = pozycje.filter((p) => p.spełnione).reduce((s, p) => s + p.waga, 0);
  const procent = maxPunkty > 0 ? Math.round((punkty / maxPunkty) * 100) : 0;

  return {
    procent,
    poziom: poziomZProcentu(procent),
    punkty,
    maxPunkty,
    pozycje,
    slowaKluczowe: wsk.slowa,
  };
}

/** Uproszczona ocena na liście publicznej (bez opisu/telefonu w select). */
export function obliczJakoscZOfertyPublicznej(o: {
  title: string;
  equipment_category?: string | null;
  category?: string | null;
  price_amount?: number | null;
  price_unit?: string | null;
  location_text?: string | null;
  image_urls?: string[] | null;
  seller_verified?: boolean | null;
  geoportal_parcel_id?: string | null;
  parcel_area_m2?: number | null;
  parcel_number?: string | null;
  with_operator?: boolean | null;
}): number {
  const kat = o.equipment_category ?? o.category ?? "";
  let score = 0;
  if (kat) score += 10;
  if ((o.title?.length ?? 0) >= 15) score += 15;
  if ((o.image_urls?.length ?? 0) >= 1) score += 20;
  if ((o.image_urls?.length ?? 0) >= 2) score += 5;
  if (o.price_amount != null && o.price_amount > 0) score += 15;
  if (o.price_unit) score += 5;
  if (o.location_text?.trim()) score += 10;
  if (o.seller_verified) score += 10;
  if (o.geoportal_parcel_id) score += 15;
  if (o.parcel_area_m2) score += 5;
  return Math.min(100, score);
}

export function etykietaPoziomuJakosci(poziom: PoziomJakosci): string {
  switch (poziom) {
    case "kompletna":
      return "Kompletne ogłoszenie";
    case "dobra":
      return "Dobre ogłoszenie";
    case "srednia":
      return "Do uzupełnienia";
    default:
      return "Szkic";
  }
}
