export type PresetWarstwMapy = "wies" | "dzialka" | "lowiectwo" | "transport" | "czysta" | "wlasny";

export type PoziomGranicyAdmin = "wsi" | "gmina" | "powiat" | "woj";

export type ZakladkaPaneluWarstwMobile = "widok" | "granice" | "poi" | "wiecej";

const KLUCZ_WIDOKU = "naszawies-mapa-widok-zapisany";

export type StanWarstwDoZapisu = {
  trybLowiectwo: boolean;
  pokazPolowania: boolean;
  pokazOstrzezeniaLesne: boolean;
  pokazKola: boolean;
  pokazZgloszenia: boolean;
  pokazRynekMapa: boolean;
  pokazRynekDzialki: boolean;
  pokazGraniceWsi: boolean;
  pokazGraniceDzialek: boolean;
  pokazGraniceObrebow: boolean;
  pokazObrysGminy: boolean;
  pokazObrysPowiatu: boolean;
  pokazObrysWojewodztwa: boolean;
  pokazNadlesnictwa: boolean;
  pokazLesnictwa: boolean;
  pokazObwodyLowieckie: boolean;
  pokazZagospodarowanie: boolean;
  pokazAdresyKin: boolean;
  pokazGeoKontekst: boolean;
  pokazPoiWarstwa: boolean;
  pokazCmentarze: boolean;
  pokazOswietlenie: boolean;
  filtrPoi: string;
  tylkoObrysPrg: boolean;
  tylkoOferty: boolean;
  promienKm: number;
};

export type UstawiaczeWarstw = {
  ustawTrybLowiectwo: (v: boolean) => void;
  ustawPokazPolowania: (v: boolean) => void;
  ustawPokazOstrzezeniaLesne: (v: boolean) => void;
  ustawPokazKola: (v: boolean) => void;
  ustawPokazZgloszenia: (v: boolean) => void;
  ustawPokazRynekMapa: (v: boolean) => void;
  ustawPokazRynekDzialki: (v: boolean) => void;
  ustawPokazGraniceWsi: (v: boolean) => void;
  ustawPokazGraniceDzialek: (v: boolean) => void;
  ustawPokazGraniceObrebow: (v: boolean) => void;
  ustawPokazObrysGminy: (v: boolean) => void;
  ustawPokazObrysPowiatu: (v: boolean) => void;
  ustawPokazObrysWojewodztwa: (v: boolean) => void;
  ustawPokazNadlesnictwa: (v: boolean) => void;
  ustawPokazLesnictwa: (v: boolean) => void;
  ustawPokazObwodyLowieckie: (v: boolean) => void;
  ustawPokazZagospodarowanie: (v: boolean) => void;
  ustawPokazAdresyKin: (v: boolean) => void;
  ustawPokazGeoKontekst: (v: boolean) => void;
  ustawPokazPoiWarstwa: (v: boolean) => void;
  ustawPokazCmentarze: (v: boolean) => void;
  ustawPokazOswietlenie: (v: boolean) => void;
  setFiltrPoi: (v: string) => void;
  ustawTylkoObrysPrg: (v: boolean) => void;
  ustawTylkoOferty: (v: boolean) => void;
  ustawPromienKm: (v: number) => void;
  ustawPodklad?: (rodzaj: "mapa" | "satelita" | "ortofoto") => void;
};

export function odczytajPoziomGranicyAdmin(stan: {
  pokazGraniceWsi: boolean;
  pokazObrysGminy: boolean;
  pokazObrysPowiatu: boolean;
  pokazObrysWojewodztwa: boolean;
}): { wlaczone: boolean; poziom: PoziomGranicyAdmin } {
  if (stan.pokazObrysWojewodztwa) return { wlaczone: true, poziom: "woj" };
  if (stan.pokazObrysPowiatu) return { wlaczone: true, poziom: "powiat" };
  if (stan.pokazObrysGminy) return { wlaczone: true, poziom: "gmina" };
  if (stan.pokazGraniceWsi) return { wlaczone: true, poziom: "wsi" };
  return { wlaczone: false, poziom: "wsi" };
}

export function ustawGraniceAdmin(
  ustaw: Pick<
    UstawiaczeWarstw,
    | "ustawPokazGraniceWsi"
    | "ustawPokazObrysGminy"
    | "ustawPokazObrysPowiatu"
    | "ustawPokazObrysWojewodztwa"
  >,
  wlaczone: boolean,
  poziom: PoziomGranicyAdmin,
): void {
  if (!wlaczone) {
    ustaw.ustawPokazGraniceWsi(false);
    ustaw.ustawPokazObrysGminy(false);
    ustaw.ustawPokazObrysPowiatu(false);
    ustaw.ustawPokazObrysWojewodztwa(false);
    return;
  }
  ustaw.ustawPokazGraniceWsi(poziom === "wsi" || poziom === "gmina");
  ustaw.ustawPokazObrysGminy(poziom === "gmina");
  ustaw.ustawPokazObrysPowiatu(poziom === "powiat");
  ustaw.ustawPokazObrysWojewodztwa(poziom === "woj");
}

export function zastosujPresetWarstw(preset: PresetWarstwMapy, u: UstawiaczeWarstw): void {
  const wylaczLowiectwo = () => {
    u.ustawTrybLowiectwo(false);
    u.ustawPokazNadlesnictwa(false);
    u.ustawPokazLesnictwa(false);
    u.ustawPokazObwodyLowieckie(false);
    u.ustawPokazKola(false);
  };

  switch (preset) {
    case "wies":
      wylaczLowiectwo();
      u.ustawPokazGraniceWsi(true);
      u.ustawPokazGraniceDzialek(false);
      u.ustawPokazGraniceObrebow(false);
      u.ustawPokazObrysGminy(false);
      u.ustawPokazObrysPowiatu(false);
      u.ustawPokazObrysWojewodztwa(false);
      u.ustawPokazPolowania(true);
      u.ustawPokazOstrzezeniaLesne(true);
      u.ustawPokazZgloszenia(true);
      u.ustawPokazRynekMapa(true);
      u.ustawPokazRynekDzialki(true);
      u.ustawPokazPoiWarstwa(true);
      u.ustawPokazCmentarze(true);
      u.ustawPokazZagospodarowanie(false);
      u.ustawPokazAdresyKin(false);
      u.ustawPokazGeoKontekst(false);
      u.setFiltrPoi("wszystkie");
      u.ustawPokazOswietlenie(false);
      u.ustawTylkoObrysPrg(false);
      u.ustawTylkoOferty(false);
      u.ustawPodklad?.("mapa");
      break;
    case "dzialka":
      wylaczLowiectwo();
      u.ustawPokazGraniceWsi(true);
      u.ustawPokazGraniceDzialek(true);
      u.ustawPokazGraniceObrebow(true);
      u.ustawPokazZagospodarowanie(true);
      u.ustawPokazPolowania(false);
      u.ustawPokazOstrzezeniaLesne(false);
      u.ustawPokazZgloszenia(false);
      u.ustawPokazRynekMapa(true);
      u.ustawPokazRynekDzialki(true);
      u.ustawPokazPoiWarstwa(true);
      u.ustawPokazCmentarze(false);
      u.setFiltrPoi("wszystkie");
      u.ustawPodklad?.("ortofoto");
      break;
    case "lowiectwo":
      u.ustawTrybLowiectwo(true);
      u.ustawPokazPolowania(true);
      u.ustawPokazOstrzezeniaLesne(true);
      u.ustawPokazKola(true);
      u.ustawPokazNadlesnictwa(true);
      u.ustawPokazLesnictwa(true);
      u.ustawPokazObwodyLowieckie(true);
      u.ustawPokazZgloszenia(false);
      u.ustawPokazRynekMapa(false);
      u.ustawPokazRynekDzialki(false);
      u.ustawPokazGraniceDzialek(false);
      u.ustawPokazGraniceObrebow(false);
      u.ustawPokazZagospodarowanie(false);
      u.setFiltrPoi("wszystkie");
      u.ustawPodklad?.("satelita");
      break;
    case "transport":
      wylaczLowiectwo();
      u.ustawPokazPolowania(false);
      u.ustawPokazOstrzezeniaLesne(false);
      u.ustawPokazZgloszenia(false);
      u.ustawPokazRynekMapa(false);
      u.ustawPokazGraniceWsi(true);
      u.ustawPokazPoiWarstwa(true);
      u.setFiltrPoi("transport");
      u.ustawPodklad?.("mapa");
      break;
    case "czysta":
      wylaczLowiectwo();
      u.ustawPokazGraniceWsi(true);
      u.ustawPokazGraniceDzialek(false);
      u.ustawPokazGraniceObrebow(false);
      u.ustawPokazPolowania(false);
      u.ustawPokazOstrzezeniaLesne(false);
      u.ustawPokazZgloszenia(false);
      u.ustawPokazRynekMapa(false);
      u.ustawPokazRynekDzialki(false);
      u.ustawPokazPoiWarstwa(false);
      u.ustawPokazCmentarze(false);
      u.ustawPokazZagospodarowanie(false);
      u.ustawPokazAdresyKin(false);
      u.ustawPokazGeoKontekst(false);
      u.ustawPokazOswietlenie(false);
      u.setFiltrPoi("wszystkie");
      u.ustawPodklad?.("mapa");
      break;
    default:
      break;
  }
}

export function liczAktywneWarstwy(stan: {
  trybLowiectwo: boolean;
  pokazPolowania: boolean;
  pokazOstrzezeniaLesne: boolean;
  pokazKola: boolean;
  pokazZgloszenia: boolean;
  pokazRynekMapa: boolean;
  pokazRynekDzialki: boolean;
  pokazGraniceWsi: boolean;
  pokazGraniceDzialek: boolean;
  pokazGraniceObrebow: boolean;
  pokazObrysGminy: boolean;
  pokazObrysPowiatu: boolean;
  pokazObrysWojewodztwa: boolean;
  pokazNadlesnictwa: boolean;
  pokazLesnictwa: boolean;
  pokazObwodyLowieckie: boolean;
  pokazZagospodarowanie: boolean;
  pokazAdresyKin: boolean;
  pokazGeoKontekst: boolean;
  pokazPoiWarstwa: boolean;
  pokazCmentarze: boolean;
  pokazOswietlenie: boolean;
  tylkoObrysPrg: boolean;
  tylkoOferty: boolean;
}): number {
  let n = 0;
  if (stan.trybLowiectwo) n++;
  if (stan.pokazPolowania) n++;
  if (stan.pokazOstrzezeniaLesne) n++;
  if (stan.pokazKola) n++;
  if (stan.pokazZgloszenia) n++;
  if (stan.pokazRynekMapa) n++;
  if (stan.pokazRynekDzialki && stan.pokazRynekMapa) n++;
  if (stan.pokazGraniceWsi) n++;
  if (stan.pokazGraniceDzialek) n++;
  if (stan.pokazGraniceObrebow) n++;
  if (stan.pokazObrysGminy) n++;
  if (stan.pokazObrysPowiatu) n++;
  if (stan.pokazObrysWojewodztwa) n++;
  if (stan.pokazNadlesnictwa) n++;
  if (stan.pokazLesnictwa) n++;
  if (stan.pokazObwodyLowieckie) n++;
  if (stan.pokazZagospodarowanie) n++;
  if (stan.pokazAdresyKin) n++;
  if (stan.pokazGeoKontekst) n++;
  if (stan.pokazPoiWarstwa) n++;
  if (stan.pokazCmentarze) n++;
  if (stan.pokazOswietlenie) n++;
  if (stan.tylkoObrysPrg) n++;
  if (stan.tylkoOferty) n++;
  return n;
}

export function zapiszWidokMapy(stan: StanWarstwDoZapisu): void {
  try {
    sessionStorage.setItem(KLUCZ_WIDOKU, JSON.stringify(stan));
  } catch {
    /* ignore */
  }
}

export function wczytajWidokMapy(): StanWarstwDoZapisu | null {
  try {
    const raw = sessionStorage.getItem(KLUCZ_WIDOKU);
    if (!raw) return null;
    return JSON.parse(raw) as StanWarstwDoZapisu;
  } catch {
    return null;
  }
}

export function czyPasujeDoPresetu(
  preset: Exclude<PresetWarstwMapy, "wlasny">,
  stan: StanWarstwDoZapisu,
): boolean {
  const probe: StanWarstwDoZapisu = { ...stan };
  const captured: Partial<StanWarstwDoZapisu> = {};
  const u: UstawiaczeWarstw = {
    ustawTrybLowiectwo: (v) => {
      captured.trybLowiectwo = v;
    },
    ustawPokazPolowania: (v) => {
      captured.pokazPolowania = v;
    },
    ustawPokazOstrzezeniaLesne: (v) => {
      captured.pokazOstrzezeniaLesne = v;
    },
    ustawPokazKola: (v) => {
      captured.pokazKola = v;
    },
    ustawPokazZgloszenia: (v) => {
      captured.pokazZgloszenia = v;
    },
    ustawPokazRynekMapa: (v) => {
      captured.pokazRynekMapa = v;
    },
    ustawPokazRynekDzialki: (v) => {
      captured.pokazRynekDzialki = v;
    },
    ustawPokazGraniceWsi: (v) => {
      captured.pokazGraniceWsi = v;
    },
    ustawPokazGraniceDzialek: (v) => {
      captured.pokazGraniceDzialek = v;
    },
    ustawPokazGraniceObrebow: (v) => {
      captured.pokazGraniceObrebow = v;
    },
    ustawPokazObrysGminy: (v) => {
      captured.pokazObrysGminy = v;
    },
    ustawPokazObrysPowiatu: (v) => {
      captured.pokazObrysPowiatu = v;
    },
    ustawPokazObrysWojewodztwa: (v) => {
      captured.pokazObrysWojewodztwa = v;
    },
    ustawPokazNadlesnictwa: (v) => {
      captured.pokazNadlesnictwa = v;
    },
    ustawPokazLesnictwa: (v) => {
      captured.pokazLesnictwa = v;
    },
    ustawPokazObwodyLowieckie: (v) => {
      captured.pokazObwodyLowieckie = v;
    },
    ustawPokazZagospodarowanie: (v) => {
      captured.pokazZagospodarowanie = v;
    },
    ustawPokazAdresyKin: (v) => {
      captured.pokazAdresyKin = v;
    },
    ustawPokazGeoKontekst: (v) => {
      captured.pokazGeoKontekst = v;
    },
    ustawPokazPoiWarstwa: (v) => {
      captured.pokazPoiWarstwa = v;
    },
    ustawPokazCmentarze: (v) => {
      captured.pokazCmentarze = v;
    },
    ustawPokazOswietlenie: (v) => {
      captured.pokazOswietlenie = v;
    },
    setFiltrPoi: (v) => {
      captured.filtrPoi = v;
    },
    ustawTylkoObrysPrg: (v) => {
      captured.tylkoObrysPrg = v;
    },
    ustawTylkoOferty: (v) => {
      captured.tylkoOferty = v;
    },
    ustawPromienKm: () => {},
  };
  zastosujPresetWarstw(preset, u);
  const keys = Object.keys(captured) as (keyof StanWarstwDoZapisu)[];
  return keys.every((k) => stan[k] === captured[k]);
}
