/**
 * Kuratorowany katalog źródeł przydatnych dla naszawies.pl.
 * Geoportal = usługi WFS/WMS (bezpośrednio).
 * dane.gov.pl = katalog + linki do API instytucji.
 */

export type StatusIntegracji =
  | "wdrozone" // już w cronie / mapie
  | "katalog" // opisane, do wdrożenia
  | "zewnetrzne_api"; // wymaga klucza / umowy (GUS REGON, ePUAP)

export type ZrodloOtwarteDane = {
  id: string;
  zrodlo: "geoportal" | "dane.gov.pl" | "osm" | "gus" | "inne";
  tytul: string;
  opis: string;
  zastosowanie: string;
  status: StatusIntegracji;
  url?: string;
  apiUrl?: string;
  envZmienne?: string[];
  datasetIdDaneGov?: string;
};

export const KATALOG_ZRODEL_NASZAWIES: ZrodloOtwarteDane[] = [
  {
    id: "prg-granice",
    zrodlo: "geoportal",
    tytul: "PRG — granice wsi",
    opis: "Obrys sołectwa / jednostki ewidencyjnej (WFS AdministrativeBoundaries).",
    zastosowanie: "Mapa: polygon wsi, sync co 2–4 h, panel sołtysa.",
    status: "wdrozone",
    url: "https://www.geoportal.gov.pl/pl/dane/panstwowy-rejestr-granic-prg",
    apiUrl: "https://mapy.geoportal.gov.pl/wss/service/PZGIK/PRG/WFS/AdministrativeBoundaries",
    envZmienne: ["GEOPORTAL_PRG_WFS_URL", "GEOPORTAL_PRG_WFS_LAYERS"],
    datasetIdDaneGov: "726",
  },
  {
    id: "kin-adresy",
    zrodlo: "geoportal",
    tytul: "KIN — punkty adresowe",
    opis: "Krajowa Integracja Numeracji Adresowej (ulice, numery domów).",
    zastosowanie: "Profil wsi: lista adresów urzędowych; walidacja lokalizacji zgłoszeń.",
    status: "wdrozone",
    url: "https://www.geoportal.gov.pl/",
    apiUrl: "https://mapy.geoportal.gov.pl/wss/ext/KrajowaIntegracjaNumeracjiAdresowej",
    envZmienne: ["GEOPORTAL_PRG_ADDRESS_WFS_URL", "GEOPORTAL_PRG_ADDRESS_WFS_TYPENAME"],
    datasetIdDaneGov: "726",
  },
  {
    id: "prng-nazwy",
    zrodlo: "geoportal",
    tytul: "PRNG — nazwy geograficzne",
    opis: "Rzeki, wzniesienia, lasy — urzędowe nazwy obiektów fizjograficznych.",
    zastosowanie: "Kontekst mapy / profil wsi (cron sync kontekstu Geoportal).",
    status: "wdrozone",
    url: "https://www.geoportal.gov.pl/pl/dane/panstwowy-rejestr-nazw-geograficznych-prng/",
    apiUrl: "https://mapy.geoportal.gov.pl/wss/service/PZGIK/PRNG/WFS/GeographicalNames",
    envZmienne: ["GEOPORTAL_PRNG_WFS_TYPENAME"],
    datasetIdDaneGov: "727",
  },
  {
    id: "prg-instytucje",
    zrodlo: "geoportal",
    tytul: "PRG — instytucje (OSP, policja, urząd skarbowy…)",
    opis: "Granice komórek organizacyjnych: KP PSP, policja, nadleśnictwo, ZWiK itd.",
    zastosowanie: "Kontekst bezpieczeństwa i usług publicznych wokół wsi (nie zawsze pinezka na mapie).",
    status: "wdrozone",
    apiUrl: "https://mapy.geoportal.gov.pl/wss/service/PZGIK/PRG/WFS/AdministrativeBoundaries",
    envZmienne: ["GEOPORTAL_PRG_INSTITUTIONAL_TYPENAMES"],
    datasetIdDaneGov: "726",
  },
  {
    id: "osm-poi",
    zrodlo: "osm",
    tytul: "OpenStreetMap (Overpass)",
    opis: "Szkoły, kościoły, sklepy, przystanki, OSP, hydranty (fire_hydrant) — pinezki na mapie.",
    zastosowanie: "Automatyczne POI + transport (dopasowanie przystanków GTFS). Hydrantów nie ma w PRG/BDOT.",
    status: "wdrozone",
    url: "https://www.openstreetmap.org/",
    envZmienne: ["POI_AUTO_SYNC_ENABLED"],
  },
  {
    id: "prng-woda-poi",
    zrodlo: "geoportal",
    tytul: "PRNG — studnie, źródła, zbiorniki",
    opis: "Nazwy geograficzne z PRNG mapowane na punkty wody OSP i nazwy geo.",
    zastosowanie: "Cron kontekstu Geoportal → geo_context_features → POI (source=geoportal).",
    status: "wdrozone",
    apiUrl: "https://mapy.geoportal.gov.pl/wss/service/PZGIK/PRNG/WFS/GeographicalNames",
    envZmienne: ["GEOPORTAL_POI_SYNC_ENABLED", "GEOPORTAL_PRNG_WFS_TYPENAMES"],
    datasetIdDaneGov: "727",
  },
  {
    id: "teryt-gus",
    zrodlo: "gus",
    tytul: "TERYT (GUS)",
    opis: "Kody SIMC/TERC, nazwy miejscowości — weryfikacja rejestracji wsi.",
    zastosowanie: "Walidacja formularzy, dopasowanie adresów KIN po SIMC.",
    status: "katalog",
    url: "https://api.stat.gov.pl/",
    apiUrl: "https://api.stat.gov.pl/Home/TerytApi",
    datasetIdDaneGov: "747",
  },
  {
    id: "regon-gus",
    zrodlo: "gus",
    tytul: "REGON (BIR1)",
    opis: "Dane podmiotów: OSP, parafia, firma lokalna po NIP/REGON.",
    zastosowanie: "Auto-uzupełnienie profilu organizacji / fundacji wsi.",
    status: "zewnetrzne_api",
    url: "https://api.stat.gov.pl/",
    datasetIdDaneGov: "544",
  },
  {
    id: "gddkia-drogi",
    zrodlo: "dane.gov.pl",
    tytul: "GDDKiA — utrudnienia na drogach",
    opis: "Aktualne roboty i utrudnienia na drogach krajowych (API/XML).",
    zastosowanie: "Powiadomienie mieszkańców przy dojeździe do miasta / szpitala.",
    status: "katalog",
    url: "https://dane.gov.pl/",
    datasetIdDaneGov: "2752",
  },
  {
    id: "pkw-wybory",
    zrodlo: "dane.gov.pl",
    tytul: "PKW — wyniki wyborów",
    opis: "Frekwencja i wyniki w obwodach (historycznie per sołectwo).",
    zastosowanie: "Statystyka „życie obywatelskie” wsi (read-only, edukacja).",
    status: "katalog",
    url: "https://dane.gov.pl/",
  },
  {
    id: "gus-spis-rolny",
    zrodlo: "dane.gov.pl",
    tytul: "GUS — spis rolny / profil gospodarki",
    opis: "Struktura gospodarstw, użytki rolne (agregaty gminne).",
    zastosowanie: "Krótki profil rolniczy wsi w sekcji „O nas”.",
    status: "katalog",
    url: "https://dane.gov.pl/",
  },
  {
    id: "geoportal-orto",
    zrodlo: "geoportal",
    tytul: "Ortofotomapa (WMS)",
    opis: "Podkład lotniczy zamiast OpenStreetMap na mapie publicznej.",
    zastosowanie: "Lepszy podgląd pól, dróg polnych, zabudowy.",
    status: "katalog",
    url: "https://mapy.geoportal.gov.pl/wss/service/PZGIK/ORTO/WMS/StandardResolution",
    envZmienne: ["NEXT_PUBLIC_GEOPORTAL_WMS_URL", "NEXT_PUBLIC_GEOPORTAL_WMS_LAYERS"],
  },
];

export function zrodlaWdrozone(): ZrodloOtwarteDane[] {
  return KATALOG_ZRODEL_NASZAWIES.filter((z) => z.status === "wdrozone");
}

export function zrodlaDoWdrozenia(): ZrodloOtwarteDane[] {
  return KATALOG_ZRODEL_NASZAWIES.filter((z) => z.status !== "wdrozone");
}
