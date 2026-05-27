import { wyszukajStacjePkpPoNazwie, type PkpStation } from "@/lib/transport/pkp-plk-api";

/** Normalizacja nazwy powiatu do klucza słownika. */
export function kluczPowiatu(county: string): string {
  return county
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/^powiat\s+/i, "")
    .replace(/\s+powiat$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Siedziby powiatów → fraza do wyszukiwarki PKP (najczęstsze trafienia).
 * Uzupełniaj w miarę potrzeb; brak wpisu → heurystyka z nazwą powiatu.
 */
const FRAZA_STACJI_POWIAT: Record<string, string> = {
  bydgoski: "Bydgoszcz Główna",
  inowrocławski: "Inowrocław",
  mogileński: "Mogilno",
  nakielski: "Nakło nad Notecią",
  sępoleński: "Sępólno Krajeńskie",
  tucholski: "Tuchola",
  żniński: "Żnin",
  chełmiński: "Chełmża",
  grudziądzki: "Grudziądz",
  wąbrzeski: "Wąbrzeźno",
  brodnicki: "Brodnica",
  "golubsko-dobrzyński": "Golub-Dobrzyń",
  lipnowski: "Lipno",
  radziejowski: "Radziejów",
  rypiński: "Rypin",
  toruński: "Toruń Główny",
  włocławski: "Włocławek",
  aleksandrowski: "Aleksandrów Kujawski",
  poznański: "Poznań Główny",
  gnieźnieński: "Gniezno",
  koninski: "Konin",
  kaliski: "Kalisz",
  leszczyński: "Leszno",
  pilski: "Piła Główna",
  rawski: "Rawicz",
  warszawski: "Warszawa Centralna",
  legionowski: "Legionowo",
  pruszkowski: "Pruszków",
  otwocki: "Otwock",
  krakowski: "Kraków Główny",
  wielicki: "Wieliczka",
  oświęcimski: "Oświęcim",
  wadowicki: "Wadowice",
  gdański: "Gdańsk Główny",
  gdyński: "Gdynia Główna",
  sopocki: "Sopot",
  kartuski: "Kartuzy",
  wejherowski: "Wejherowo",
  lęborski: "Lębork",
  słupski: "Słupsk",
  wrocławski: "Wrocław Główny",
  legnicki: "Legnica",
  głogowski: "Głogów",
  lubinski: "Lubin",
  świdnicki: "Świdnica",
  wałbrzyski: "Wałbrzych",
  lubiński: "Lubin",
  zielonogórski: "Zielona Góra",
  żarski: "Żary",
  żagański: "Żagań",
  nowosolski: "Nowa Sól",
  krośnieński: "Krosno",
  przemyski: "Przemyśl Główny",
  rzeszowski: "Rzeszów Główny",
  białostocki: "Białystok",
  suwalski: "Suwałki",
  łomżyński: "Łomża",
  olsztyński: "Olsztyn Główny",
  elbląski: "Elbląg",
  ełcki: "Ełk",
  kętrzyński: "Kętrzyn",
  szczeciński: "Szczecin Główny",
  stargardzki: "Stargard",
  koszaliński: "Koszalin",
  kołobrzeski: "Kołobrzeg",
  częstochowski: "Częstochowa",
  zawierciański: "Zawiercie",
  katowicki: "Katowice",
  gliwicki: "Gliwice",
  rybnicki: "Rybnik",
  bielski: "Bielsko-Biała Główna",
  sosnowiecki: "Sosnowiec Główny",
  łódzki: "Łódź Fabryczna",
  pabianicki: "Pabianice",
  zgierski: "Zgierz",
  sieradzki: "Sieradz",
  tomaszowski: "Tomaszów Mazowiecki",
  kielecki: "Kielce",
  starachowicki: "Starachowice",
  ostrowiecki: "Ostrowiec Świętokrzyski",
  lubelski: "Lublin",
  zamojski: "Zamość",
  chełmski: "Chełm",
  bialski: "Biała Podlaska",
  radomski: "Radom",
  płocki: "Płock",
  sierpecki: "Sierpc",
  ciechanowski: "Ciechanów",
  ostrołęcki: "Ostrołęka",
  piaseczyński: "Piaseczno",
};

const FRAZA_WOJEWODZKIE: Record<string, string> = {
  "kujawsko-pomorskie": "Bydgoszcz Główna",
  "wielkopolskie": "Poznań Główny",
  mazowieckie: "Warszawa Centralna",
  małopolskie: "Kraków Główny",
  pomorskie: "Gdańsk Główny",
  dolnośląskie: "Wrocław Główny",
  "dolno-slaskie": "Wrocław Główny",
  lubuskie: "Zielona Góra",
  łódzkie: "Łódź Fabryczna",
  lódzkie: "Łódź Fabryczna",
  lubelskie: "Lublin",
  podlaskie: "Białystok",
  "warmińsko-mazurskie": "Olsztyn Główny",
  zachodniopomorskie: "Szczecin Główny",
  śląskie: "Katowice",
  slaskie: "Katowice",
  opolskie: "Opole Główne",
  podkarpackie: "Rzeszów Główny",
  świętokrzyskie: "Kielce",
  "swietokrzyskie": "Kielce",
};

/** Czy kierunek pociągu pasuje do frazy stacji docelowej (heurystyka bez wywołania API). */
/** Dopasowanie kierunku: najpierw nazwa stacji PKP z relacji, potem fraza słownika. */
export function odjazdPasujeDoCelu(
  destination: string | null,
  frazaStacji: string,
  nazwaStacjiPkp?: string | null,
): boolean {
  if (nazwaStacjiPkp?.trim() && odjazdPasujeDoFrazyStacji(destination, nazwaStacjiPkp)) return true;
  return odjazdPasujeDoFrazyStacji(destination, frazaStacji);
}

export function odjazdPasujeDoFrazyStacji(destination: string | null, frazaStacji: string): boolean {
  if (!destination?.trim() || !frazaStacji?.trim()) return false;
  const norm = (s: string) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const d = norm(destination);
  const slowa = norm(frazaStacji)
    .split(/\s+/)
    .filter((w) => w.length >= 4);
  if (slowa.length === 0) return d.includes(norm(frazaStacji));
  return slowa.some((w) => d.includes(w));
}

export function frazaStacjiDlaPowiatu(county: string): string {
  const k = kluczPowiatu(county);
  return FRAZA_STACJI_POWIAT[k] ?? county.replace(/^powiat\s+/i, "").trim();
}

export function frazaStacjiDlaWojewodztwa(voivodeship: string): string {
  const k = kluczPowiatu(voivodeship);
  return FRAZA_WOJEWODZKIE[k] ?? voivodeship.trim();
}

export async function rozwiazStacjePkp(fraza: string): Promise<PkpStation | null> {
  const q = fraza.trim();
  if (!q) return null;
  try {
    const lista = await wyszukajStacjePkpPoNazwie(q);
    return lista[0] ?? null;
  } catch {
    return null;
  }
}

export async function rozwiazStacjePowiatu(county: string): Promise<PkpStation | null> {
  return rozwiazStacjePkp(frazaStacjiDlaPowiatu(county));
}

export async function rozwiazStacjeWojewodztwa(voivodeship: string): Promise<PkpStation | null> {
  return rozwiazStacjePkp(frazaStacjiDlaWojewodztwa(voivodeship));
}
