/** Czytelne etykiety segmentów URL panelu (okruszki). */
export const ETYKIETA_SEGMENTU_PANELU: Record<string, string> = {
  panel: "Start",
  mieszkaniec: "Moja wieś",
  moje: "Obserwowane",
  soltys: "Sołtys",
  profil: "Ustawienia",
  czat: "Wiadomości",
  powiadomienia: "Powiadomienia",
  sugestie: "Sugestie",
  admin: "Admin",
  spolecznosc: "Społeczność",
  ogloszenia: "Ogłoszenia",
  marketplace: "Rynek lokalny",
  firmy: "Firma / sklep",
  uslugi: "Profil firmy",
  przypomnienia: "Przypomnienia",
  "profil-rynek": "Profil sprzedawcy",
  "lista-zakupow": "Lista zakupów",
  "rolnictwo-ceny": "Ceny skupu",
  swietlica: "Świetlica",
  grafika: "Kreator grafiki",
  zgloszenia: "Zgłoszenia",
  fotokronika: "Fotokronika",
  "pomoc-sasiedzka": "Pomoc sąsiedzka",
  historia: "Historia",
  pomoc: "Pomoc",
  "moja-wies": "Profil wsi",
  mapa: "Mapa wsi",
  kalendarz: "Kalendarz",
  rezerwacje: "Rezerwacje",
  konkursy: "Konkursy",
  transport: "Transport",
  szkola: "Szkoła",
  sport: "Sport",
  "kanaly-rss": "RSS",
  cmentarz: "Cmentarz",
  dokumenty: "Dokumenty",
  zespol: "Zespół",
  samorzad: "Samorząd",
  "informacje-lokalne": "Info lokalne",
  "wniosek-soltysa": "Wniosek sołtysa",
  "pierwsze-kroki": "Pierwsze kroki",
  onboarding: "Wybór wsi",
  rada: "Rada sołecka",
  wies: "Moje wsie",
  organizacje: "Organizacje",
  ulubione: "Ulubione",
  lowiectwo: "Polowania",
};

export type OkruszekPanelu = { href: string; label: string };

export function budujOkruszkiPanelu(pathname: string): OkruszekPanelu[] {
  if (!pathname.startsWith("/panel")) return [];

  const segmenty = pathname.split("/").filter(Boolean);
  const out: OkruszekPanelu[] = [];
  let sciezka = "";

  for (let i = 0; i < segmenty.length; i++) {
    const seg = segmenty[i];
    sciezka += `/${seg}`;
    const jestUuid = /^[0-9a-f-]{36}$/i.test(seg);
    if (jestUuid) {
      out.push({ href: sciezka, label: "Szczegóły" });
      continue;
    }
    const label = ETYKIETA_SEGMENTU_PANELU[seg] ?? seg.replace(/-/g, " ");
    out.push({ href: sciezka, label });
  }

  return out;
}
