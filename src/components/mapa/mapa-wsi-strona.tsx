"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Fragment,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  etykietaKategoriiPoi,
  KATEGORIA_LATARNIA,
} from "@/lib/mapa/kategorie-poi";
import {
  KATEGORIE_POI_DROGA_NOCLEG,
  KATEGORIE_POI_RATUNEK_WODA,
  KATEGORIE_POI_TRANSPORT,
  KATEGORIE_POI_USLUGI,
  nalezyDoGrupyPoi,
} from "@/lib/mapa/kategorie-poi-grupy";
import { czyKategoriaPoiLowiecka } from "@/lib/mapa/poi-lowieckie-widocznosc";
import { obrysPowiatuZznacznikow } from "@/lib/mapa/obrys-administracyjny";
import { wiesMaObrys } from "@/lib/mapa/wies-ma-obrys";
import { punktWBbox } from "@/lib/mapa/bbox-mapy";
import type { GeoJsonObject } from "geojson";
import { MapaLowiectwoOverlay } from "@/components/mapa/mapa-lowiectwo-overlay";
import { odliczanieZywHms, tekstOdliczaniaPolowania } from "@/lib/mapa/formatuj-polowanie";
import type { ZnacznikRewirLowiecki } from "./mapa-wsi-leaflet";
import { slugCzesciZBazy } from "@/lib/wies/slug-administracyjny";
import { etykietaStatusuInwestycji, KATEGORIA_INWESTYCJA } from "@/lib/mapa/inwestycje-poi";
import { useKlientGotowy } from "@/lib/ui/use-klient-gotowy";
import {
  filtrujZnacznikiAdministracyjnie,
  MapaFiltrAdministracyjny,
  type FiltrAdministracyjny,
} from "@/components/mapa/mapa-filtr-administracyjny";
import { sciezkaGminy } from "@/lib/wies/sciezka-publiczna";
import {
  odczytajIdPoiZParametrow,
  odczytajKategoriePoiZParametrow,
} from "@/lib/mapa/parametry-url-mapy";
import {
  indeksKategoriiPoiPoWsi,
  obliczStatystykiPoiNaMapie,
} from "@/lib/mapa/statystyki-poi-mapy";
import { obliczSredniaKompletnoscMapy } from "@/lib/mapa/wybierz-wsi-do-uzupelnienia";
import { filtrAdminZParametrowUrl, czyDomyslnyFiltrPowiatu } from "@/lib/mapa/domyslny-filtr-mapy";
import type { BboxMapy } from "@/lib/mapa/bbox-mapy";
import {
  liczAktywneWarstwy,
  zastosujPresetWarstw,
  type PresetWarstwMapy,
  type UstawiaczeWarstw,
} from "@/lib/mapa/mapa-presety-warstw";
import { MapaPanelWarstw } from "@/components/mapa/mapa-panel-warstw";
import { MapaSidebarSkroty } from "@/components/mapa/mapa-sidebar-skroty";
import { MapaEgibToast } from "@/components/mapa/mapa-egib-toast";
import { CZY_KIEG_WMS_DOSTEPNY, KIEG_WMS_MIN_ZOOM } from "@/lib/geoportal/kieg-wms";
import {
  MapaWsiLeaflet,
  type MapaWsiLeafletRef,
  type ObrysLanduseMapy,
  type ObrysLesnictwaMapy,
  type ObrysNadlesnictwaMapy,
  type ObrysObwoduLowieckiegoMapy,
  type ZnacznikAdres,
  type ZnacznikCmentarzObrys,
  type ZnacznikGeoKontekst,
  type ZnacznikPoi,
  type ZnacznikKoloLowieckie,
  type ZnacznikOstrzezeniaLesnego,
  type ZnacznikPolowanie,
  type ZnacznikRynek,
  type ZnacznikRynekDzialka,
  type ZnacznikWsi,
  type ZnacznikZgloszenie,
} from "./mapa-wsi-leaflet";

function kodTerytGminy(wsi: ZnacznikWsi[]): string | null {
  for (const z of wsi) {
    const k = z.gmina_teryt_kod?.trim();
    if (k && k.length >= 7) return k.slice(0, 7);
  }
  return null;
}

function kodTerytPowiatu(wsi: ZnacznikWsi[]): string | null {
  for (const z of wsi) {
    const p = z.powiat_teryt_kod?.trim();
    if (p && p.length >= 4) return p.slice(0, 4);
    const g = z.gmina_teryt_kod?.trim();
    if (g && g.length >= 4) return g.slice(0, 4);
  }
  return null;
}

function kodTerytWoj(wsi: ZnacznikWsi[]): string | null {
  for (const z of wsi) {
    const g = z.gmina_teryt_kod?.trim();
    if (g && g.length >= 2) return g.slice(0, 2);
    const p = z.powiat_teryt_kod?.trim();
    if (p && p.length >= 2) return p.slice(0, 2);
  }
  return null;
}

function czyPrzerwanyFetch(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

function normalizujQueryUrl(search: string): string {
  const p = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return Array.from(p.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

function czyTenSamUrlMapy(pathname: string, query: string): boolean {
  if (typeof window === "undefined") return false;
  return (
    pathname === window.location.pathname &&
    normalizujQueryUrl(query) === normalizujQueryUrl(window.location.search)
  );
}

function ListaPolowanSidebar({
  polowania,
  klientGotowy,
  onPokaz,
}: {
  polowania: ZnacznikPolowanie[];
  klientGotowy: boolean;
  onPokaz: (id: string) => void;
}) {
  const [, ustawTick] = useState(0);
  useEffect(() => {
    if (!klientGotowy || polowania.length === 0) return;
    const t = window.setInterval(() => ustawTick((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, [klientGotowy, polowania.length]);

  return (
    <ul className="mapa-skroty-lista mapa-skroty-lista--polowania max-h-44 overflow-y-auto">
      {polowania.map((p) => {
        const odlicz = klientGotowy ? tekstOdliczaniaPolowania(p.startsAt, p.endsAt) : null;
        const zywe = klientGotowy ? odliczanieZywHms(p.startsAt, p.endsAt) : null;
        return (
          <li key={p.id}>
            <button
              type="button"
              className={`mapa-skroty-lista__btn ${p.faza === "aktywne" ? "mapa-skroty-lista__btn--aktywne" : ""}`}
              onClick={() => onPokaz(p.id)}
            >
              <span className="mapa-skroty-lista__tytul">
                {p.faza === "aktywne" ? "🔴 " : "🟠 "}
                {p.title}
              </span>
              <span className="mapa-skroty-lista__meta">{p.villageName}</span>
              {zywe ? (
                <span
                  suppressHydrationWarning
                  className="mt-0.5 block font-mono text-[11px] font-bold tabular-nums text-red-800"
                >
                  {zywe.etykieta}: {zywe.hms}
                </span>
              ) : odlicz ? (
                <span suppressHydrationWarning className="block text-[10px] font-semibold text-red-800">
                  {odlicz}
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

async function pobierzGraniceWsiApi(
  ids: string[],
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  if (ids.length === 0) return {};
  try {
    const res = await fetch(`/api/mapa/granice-wsi?ids=${encodeURIComponent(ids.join(","))}`, {
      credentials: "include",
      signal,
    });
    if (!res.ok) return {};
    const data = (await res.json()) as { granice?: Record<string, unknown> };
    return data.granice ?? {};
  } catch (err) {
    if (czyPrzerwanyFetch(err)) return {};
    return {};
  }
}

async function pobierzGraniceAdminApi(
  poziom: "gmina" | "powiat" | "woj",
  teryt: string,
  signal?: AbortSignal,
): Promise<GeoJsonObject | null> {
  try {
    const res = await fetch(
      `/api/mapa/granice-admin?poziom=${encodeURIComponent(poziom)}&teryt=${encodeURIComponent(teryt)}`,
      { credentials: "include", signal },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { geojson?: GeoJsonObject };
    return data.geojson ?? null;
  } catch (err) {
    if (czyPrzerwanyFetch(err)) return null;
    return null;
  }
}

function normalizuj(tekst: string): string {
  return tekst.trim().toLowerCase().replace(/\s+/g, " ");
}

function polePasuje(wartosc: string | undefined, q: string): boolean {
  if (!wartosc) return false;
  return normalizuj(wartosc).includes(q);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const R_KM = 6371;

function odlegloscKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_KM * c;
}

function podswietlDopasowanie(tekst: string, frazaSurowa: string): ReactNode {
  const f = frazaSurowa.trim();
  if (!f || !tekst) return tekst;
  try {
    const re = new RegExp(`(${escapeRegExp(f)})`, "gi");
    const czesci = tekst.split(re);
    if (czesci.length === 1) return tekst;
    return czesci.map((cz, i) =>
      i % 2 === 1 ? (
        <mark key={i} className="rounded-sm bg-amber-200/90 px-0.5 text-stone-900">
          {cz}
        </mark>
      ) : (
        <Fragment key={i}>{cz}</Fragment>
      ),
    );
  } catch {
    return tekst;
  }
}

type TrybSidebara = "katalog" | "szukaj";

const PROMIENIE_KM = [0, 10, 25, 50, 100] as const;
const LIMIT_LISTY_WSI = 80;
const MIN_ZOOM_GRANICE_WSI = 12;

export function MapaWsiStrona({
  znaczniki,
  punktyPoi = [],
  punktyAdresy = [],
  punktyRynek = [],
  punktyRynekDzialki = [],
  punktyZgloszenia = [],
  punktyPolowania = [],
  ostrzezeniaLesne = [],
  punktyKola = [],
  rewiryLowieckie = [],
  punktyCmentarze = [],
  punktyGeoKontekst = [],
  onRozszerzDoPolski,
  ladowaniePelnejPolski = false,
}: {
  znaczniki: ZnacznikWsi[];
  punktyPoi?: ZnacznikPoi[];
  punktyAdresy?: ZnacznikAdres[];
  punktyRynek?: ZnacznikRynek[];
  punktyRynekDzialki?: ZnacznikRynekDzialka[];
  punktyZgloszenia?: ZnacznikZgloszenie[];
  punktyPolowania?: ZnacznikPolowanie[];
  ostrzezeniaLesne?: ZnacznikOstrzezeniaLesnego[];
  punktyKola?: ZnacznikKoloLowieckie[];
  rewiryLowieckie?: ZnacznikRewirLowiecki[];
  punktyCmentarze?: ZnacznikCmentarzObrys[];
  punktyGeoKontekst?: ZnacznikGeoKontekst[];
  onRozszerzDoPolski?: () => void;
  ladowaniePelnejPolski?: boolean;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const mapRef = useRef<MapaWsiLeafletRef>(null);
  const klientGotowy = useKlientGotowy();

  const [tryb, ustawTryb] = useState<TrybSidebara>(() =>
    searchParams.get("q")?.trim() ? "szukaj" : "katalog",
  );
  const [panelFiltrOtwarty, ustawPanelFiltrOtwarty] = useState(
    () => Boolean(searchParams.get("q")?.trim() || searchParams.get("woj")),
  );
  const [szukaj, setSzukaj] = useState(() => searchParams.get("q") ?? "");
  const [trybLowiectwo, ustawTrybLowiectwo] = useState(() => searchParams.get("warstwa") === "lowiectwo");
  const [filtrPoi, setFiltrPoi] = useState(() => {
    const warstwa = searchParams.get("warstwa");
    if (warstwa === "transport") return "transport";
    if (warstwa === "droga") return "droga";
    if (warstwa === "uslugi") return "uslugi";
    if (warstwa === "ratunek") return "woda_osp";
    if (warstwa === "ladne") return "ladne_miejsce";
    if (warstwa === "oswietlenie") return KATEGORIA_LATARNIA;
    if (warstwa === "inwestycje") return KATEGORIA_INWESTYCJA;
    if (warstwa === "lowiectwo") return "wszystkie";
    return odczytajKategoriePoiZParametrow(searchParams) ?? "wszystkie";
  });
  const [pokazAdresyKin, ustawPokazAdresyKin] = useState(
    () => searchParams.get("adresy") === "1",
  );
  const [pokazGeoKontekst, ustawPokazGeoKontekst] = useState(
    () => searchParams.get("geo_kontekst") === "1",
  );
  const [pokazOswietlenie, ustawPokazOswietlenie] = useState(
    () => searchParams.get("warstwa") === "oswietlenie" || searchParams.get("latarnie") === "1",
  );
  const [pokazZagospodarowanie, ustawPokazZagospodarowanie] = useState(
    () => searchParams.get("zagospodarowanie") === "1",
  );
  const [pokazZakonczoneInwestycje, ustawPokazZakonczoneInwestycje] = useState(
    () => searchParams.get("inwest_zakonczone") === "1",
  );
  const [pokazPolowania, ustawPokazPolowania] = useState(() => {
    if (searchParams.get("polowania") === "0") return false;
    const w = searchParams.get("warstwa");
    return w === "lowiectwo" || w !== "transport";
  });
  const [pokazOstrzezeniaLesne, ustawPokazOstrzezeniaLesne] = useState(() => {
    if (searchParams.get("ostrzezenia_lesne") === "0") return false;
    if (searchParams.get("ostrzezenia_lesne") === "1" || searchParams.get("les")) return true;
    const w = searchParams.get("warstwa");
    return w === "lowiectwo" || w !== "transport";
  });
  const [pokazKola, ustawPokazKola] = useState(
    () => searchParams.get("warstwa") === "lowiectwo" || searchParams.get("kola") === "1",
  );
  const [pokazZgloszenia, ustawPokazZgloszenia] = useState(() => {
    if (searchParams.get("zgloszenia") === "0") return false;
    return searchParams.get("warstwa") !== "transport" && searchParams.get("warstwa") !== "lowiectwo";
  });
  const [pokazRynekMapa, ustawPokazRynekMapa] = useState(() => {
    if (searchParams.get("rynek") === "0") return false;
    return searchParams.get("warstwa") !== "transport" && searchParams.get("warstwa") !== "lowiectwo";
  });
  const [filtrAdmin, ustawFiltrAdmin] = useState<FiltrAdministracyjny>(() =>
    filtrAdminZParametrowUrl({
      woj: searchParams.get("woj"),
      pow: searchParams.get("pow"),
      gmina: searchParams.get("gmina"),
    }),
  );
  const [filtrNazwa, ustawFiltrNazwa] = useState("");
  const [tylkoObrysPrg, ustawTylkoObrysPrg] = useState(searchParams.get("obrys") === "1");
  const [tylkoOferty, ustawTylkoOferty] = useState(searchParams.get("oferty") === "1");
  const [pokazObrysGminy, ustawPokazObrysGminy] = useState(
    searchParams.get("gmina_obrys") === "1" || Boolean(searchParams.get("gmina")),
  );
  const [pokazObrysPowiatu, ustawPokazObrysPowiatu] = useState(
    () => searchParams.get("powiat_obrys") === "1" || Boolean(searchParams.get("pow")),
  );
  const [pokazObrysWojewodztwa, ustawPokazObrysWojewodztwa] = useState(
    () => searchParams.get("woj_obrys") === "1" || Boolean(searchParams.get("woj")),
  );
  const [pokazGraniceWsi, ustawPokazGraniceWsi] = useState(() => {
    if (searchParams.get("granice_wsi") === "0") return false;
    if (searchParams.get("granice_wsi") === "1") return true;
    return false;
  });
  const [pokazGraniceDzialek, ustawPokazGraniceDzialek] = useState(
    () => searchParams.get("dzialki") !== "0",
  );
  const [pokazGraniceObrebow, ustawPokazGraniceObrebow] = useState(
    () => searchParams.get("obreby") === "1",
  );
  const [pokazNadlesnictwa, ustawPokazNadlesnictwa] = useState(
    () => searchParams.get("nadlesnictwa") === "1" || searchParams.get("warstwa") === "lowiectwo",
  );
  const [pokazLesnictwa, ustawPokazLesnictwa] = useState(
    () => searchParams.get("lesnictwa") === "1" || searchParams.get("warstwa") === "lowiectwo",
  );
  const [pokazObwodyLowieckie, ustawPokazObwodyLowieckie] = useState(
    () =>
      searchParams.get("obwody_lowieckie") === "1" || searchParams.get("warstwa") === "lowiectwo",
  );
  const [tylkoAktywnePolowania, ustawTylkoAktywnePolowania] = useState(false);
  const [promienKm, ustawPromienKm] = useState<number>(() => {
    const raw = searchParams.get("km");
    const n = raw ? Number.parseInt(raw, 10) : 0;
    return PROMIENIE_KM.includes(n as (typeof PROMIENIE_KM)[number]) ? n : 0;
  });
  const [pokazPoiWarstwa, ustawPokazPoiWarstwa] = useState(
    () => searchParams.get("poi_warstwa") === "1" || searchParams.get("poi") != null,
  );
  const [pokazRynekDzialki, ustawPokazRynekDzialki] = useState(
    () => searchParams.get("rynek_dzialki") !== "0",
  );
  const [pokazCmentarze, ustawPokazCmentarze] = useState(
    () => searchParams.get("cmentarze") !== "0",
  );
  const [zoomMapy, ustawZoomMapy] = useState(7);
  const [bboxWidoku, ustawBboxWidoku] = useState<BboxMapy | null>(null);
  const [limitListyWsi, ustawLimitListyWsi] = useState(LIMIT_LISTY_WSI);

  const szukajOdroczone = useDeferredValue(szukaj);
  const filtrNazwaOdroczony = useDeferredValue(filtrNazwa);
  const [pozycjaUzytkownika, setPozycjaUzytkownika] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [statusGps, setStatusGps] = useState<"idle" | "wczytuje" | "blad" | "ok">("idle");
  const [kopiujLink, ustawKopiujLink] = useState<"idle" | "ok" | "blad">("idle");
  const wykonanoDeepLinkWsi = useRef(false);
  const wykonanoDeepLinkPolowania = useRef(false);
  const wykonanoDeepLinkLesne = useRef(false);
  const wykonanoDeepLinkPoi = useRef(false);
  const [obrysyLanduse, ustawObrysyLanduse] = useState<ObrysLanduseMapy[]>([]);
  const [statusLanduse, ustawStatusLanduse] = useState<"idle" | "wczytuje" | "ok" | "blad">("idle");
  const [bladLanduse, ustawBladLanduse] = useState("");
  const [obrysGminyUrzedowy, ustawObrysGminyUrzedowy] = useState<GeoJsonObject | null>(null);
  const [obrysPowiatuUrzedowy, ustawObrysPowiatuUrzedowy] = useState<GeoJsonObject | null>(null);
  const [obrysWojewodztwaUrzedowy, ustawObrysWojewodztwaUrzedowy] = useState<GeoJsonObject | null>(null);
  const [graniceLazy, ustawGraniceLazy] = useState<Record<string, unknown>>({});
  const [nadlesnictwaObrysy, ustawNadlesnictwaObrysy] = useState<ObrysNadlesnictwaMapy[]>([]);
  const [lesnictwaObrysy, ustawLesnictwaObrysy] = useState<ObrysLesnictwaMapy[]>([]);
  const [obwodyLowieckieObrysy, ustawObwodyLowieckieObrysy] = useState<ObrysObwoduLowieckiegoMapy[]>(
    [],
  );

  const znacznikiEnriched = useMemo(
    () =>
      znaczniki.map((z) => ({
        ...z,
        boundary_geojson: z.boundary_geojson ?? graniceLazy[z.id] ?? null,
      })),
    [znaczniki, graniceLazy],
  );

  const poAdministracji = useMemo(
    () => filtrujZnacznikiAdministracyjnie(znacznikiEnriched, filtrAdmin),
    [znacznikiEnriched, filtrAdmin],
  );

  const obrysyGminy = useMemo(() => {
    if (!filtrAdmin.gminaSlug) return [];
    return poAdministracji;
  }, [poAdministracji, filtrAdmin.gminaSlug]);

  const poPowiacie = useMemo(() => {
    if (!filtrAdmin.powSlug || !filtrAdmin.wojSlug) return [];
    return znacznikiEnriched.filter(
      (z) =>
        slugCzesciZBazy(z.voivodeship ?? "") === filtrAdmin.wojSlug &&
        slugCzesciZBazy(z.county ?? "") === filtrAdmin.powSlug,
    );
  }, [znacznikiEnriched, filtrAdmin.powSlug, filtrAdmin.wojSlug]);

  const poWojewodztwie = useMemo(() => {
    if (!filtrAdmin.wojSlug) return [];
    return znacznikiEnriched.filter(
      (z) => slugCzesciZBazy(z.voivodeship ?? "") === filtrAdmin.wojSlug,
    );
  }, [znacznikiEnriched, filtrAdmin.wojSlug]);

  const obrysPowiatu = useMemo(() => {
    if (!pokazObrysPowiatu || !filtrAdmin.powSlug) return null;
    return obrysPowiatuZznacznikow(poPowiacie);
  }, [poPowiacie, pokazObrysPowiatu, filtrAdmin.powSlug]);

  const obrysPowiatuDoMapy = pokazObrysPowiatu ? obrysPowiatuUrzedowy ?? obrysPowiatu : null;
  const obrysWojewodztwaDoMapy = pokazObrysWojewodztwa ? obrysWojewodztwaUrzedowy : null;

  useEffect(() => {
    if (!pokazObrysGminy || !filtrAdmin.gminaSlug) {
      ustawObrysGminyUrzedowy(null);
      return;
    }
    const kod = kodTerytGminy(poAdministracji);
    if (!kod) {
      ustawObrysGminyUrzedowy(null);
      return;
    }
    const ctrl = new AbortController();
    void pobierzGraniceAdminApi("gmina", kod, ctrl.signal).then((gj) => {
      if (ctrl.signal.aborted) return;
      ustawObrysGminyUrzedowy(gj);
    });
    return () => {
      ctrl.abort();
    };
  }, [pokazObrysGminy, filtrAdmin.gminaSlug, poAdministracji]);

  useEffect(() => {
    if (!pokazObrysPowiatu || !filtrAdmin.powSlug) {
      ustawObrysPowiatuUrzedowy(null);
      return;
    }
    const kod = kodTerytPowiatu(poPowiacie);
    if (!kod) {
      ustawObrysPowiatuUrzedowy(null);
      return;
    }
    const ctrl = new AbortController();
    void pobierzGraniceAdminApi("powiat", kod, ctrl.signal).then((gj) => {
      if (ctrl.signal.aborted) return;
      ustawObrysPowiatuUrzedowy(gj);
    });
    return () => {
      ctrl.abort();
    };
  }, [pokazObrysPowiatu, filtrAdmin.powSlug, poPowiacie]);

  useEffect(() => {
    if (!pokazObrysWojewodztwa || !filtrAdmin.wojSlug) {
      ustawObrysWojewodztwaUrzedowy(null);
      return;
    }
    const kod = kodTerytWoj(poWojewodztwie);
    if (!kod) {
      ustawObrysWojewodztwaUrzedowy(null);
      return;
    }
    const ctrl = new AbortController();
    void pobierzGraniceAdminApi("woj", kod, ctrl.signal).then((gj) => {
      if (ctrl.signal.aborted) return;
      ustawObrysWojewodztwaUrzedowy(gj);
    });
    return () => {
      ctrl.abort();
    };
  }, [pokazObrysWojewodztwa, filtrAdmin.wojSlug, poWojewodztwie]);

  const linkHubGminy = useMemo(() => {
    const z = poAdministracji[0];
    if (!filtrAdmin.gminaSlug || !z?.voivodeship || !z.county || !z.commune) return null;
    return sciezkaGminy({
      voivodeship: z.voivodeship,
      county: z.county,
      commune: z.commune,
    });
  }, [poAdministracji, filtrAdmin.gminaSlug]);

  const odfiltrowane = useMemo(() => {
    let lista = poAdministracji;
    if (tryb === "szukaj") {
      const q = normalizuj(szukajOdroczone);
      if (q) {
        const qBezSpacji = q.replace(/\s/g, "");
        lista = lista.filter((z) => {
          if (polePasuje(z.name, q)) return true;
          if (polePasuje(z.commune, q)) return true;
          if (polePasuje(z.county, q)) return true;
          if (polePasuje(z.voivodeship, q)) return true;
          if (polePasuje(z.teryt_id, q)) return true;
          if (z.sciezka.toLowerCase().replace(/\s/g, "").includes(qBezSpacji)) return true;
          return false;
        });
      }
    } else {
      const q = normalizuj(filtrNazwaOdroczony);
      if (q) {
        lista = lista.filter((z) => polePasuje(z.name, q) || polePasuje(z.commune, q));
      }
    }
    if (tylkoObrysPrg) lista = lista.filter((z) => wiesMaObrys(z));
    if (tylkoOferty) lista = lista.filter((z) => z.public_offers_count > 0);
    if (pozycjaUzytkownika && promienKm > 0) {
      lista = lista.filter(
        (z) =>
          odlegloscKm(pozycjaUzytkownika.lat, pozycjaUzytkownika.lon, z.lat, z.lon) <= promienKm,
      );
    }
    return lista;
  }, [
    poAdministracji,
    tryb,
    szukajOdroczone,
    filtrNazwaOdroczony,
    tylkoObrysPrg,
    tylkoOferty,
    pozycjaUzytkownika,
    promienKm,
  ]);

  const srodekObszaruMapy = useMemo(() => {
    const zrodlo = odfiltrowane.length > 0 ? odfiltrowane : znacznikiEnriched;
    if (zrodlo.length === 0) return null;
    const lat = zrodlo.reduce((s, z) => s + z.lat, 0) / zrodlo.length;
    const lon = zrodlo.reduce((s, z) => s + z.lon, 0) / zrodlo.length;
    return { lat, lon };
  }, [odfiltrowane, znacznikiEnriched]);

  const promienWarstwLesnychM = useMemo(() => {
    if (filtrAdmin.gminaSlug) return 18_000;
    if (filtrAdmin.powSlug) return 45_000;
    if (filtrAdmin.wojSlug) return 90_000;
    return 35_000;
  }, [filtrAdmin.gminaSlug, filtrAdmin.powSlug, filtrAdmin.wojSlug]);

  const wojSlugDlaObwodow = useMemo(() => {
    if (filtrAdmin.wojSlug) return filtrAdmin.wojSlug;
    if (!srodekObszaruMapy) return null;
    let najblizsza: { slug: string; d: number } | null = null;
    for (const z of znacznikiEnriched) {
      if (!z.voivodeship) continue;
      const slug = slugCzesciZBazy(z.voivodeship);
      const d =
        (z.lat - srodekObszaruMapy.lat) ** 2 + (z.lon - srodekObszaruMapy.lon) ** 2;
      if (!najblizsza || d < najblizsza.d) najblizsza = { slug, d };
    }
    return najblizsza?.slug ?? null;
  }, [filtrAdmin.wojSlug, srodekObszaruMapy, znacznikiEnriched]);

  useEffect(() => {
    const brakujace = odfiltrowane
      .filter((z) => wiesMaObrys(z) && !z.boundary_geojson && !graniceLazy[z.id])
      .filter((z) => !bboxWidoku || punktWBbox(z.lat, z.lon, bboxWidoku))
      .map((z) => z.id)
      .slice(0, 30);
    if (brakujace.length === 0) return;
    const ctrl = new AbortController();
    void pobierzGraniceWsiApi(brakujace, ctrl.signal).then((granice) => {
      if (ctrl.signal.aborted || Object.keys(granice).length === 0) return;
      ustawGraniceLazy((prev) => ({ ...prev, ...granice }));
    });
    return () => {
      ctrl.abort();
    };
  }, [odfiltrowane, bboxWidoku]);

  useEffect(() => {
    if (!pokazNadlesnictwa || !srodekObszaruMapy) {
      ustawNadlesnictwaObrysy([]);
      return;
    }
    const { lat, lon } = srodekObszaruMapy;
    const ctrl = new AbortController();
    void fetch(
      `/api/mapa/nadlesnictwa?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&radiusM=${promienWarstwLesnychM}`,
      { credentials: "include", signal: ctrl.signal },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (ctrl.signal.aborted || !data?.obrysy) return;
        ustawNadlesnictwaObrysy(data.obrysy as ObrysNadlesnictwaMapy[]);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted || czyPrzerwanyFetch(err)) return;
        ustawNadlesnictwaObrysy([]);
      });
    return () => {
      ctrl.abort();
    };
  }, [pokazNadlesnictwa, srodekObszaruMapy, promienWarstwLesnychM]);

  useEffect(() => {
    if (!pokazLesnictwa || !srodekObszaruMapy) {
      ustawLesnictwaObrysy([]);
      return;
    }
    const { lat, lon } = srodekObszaruMapy;
    const ctrl = new AbortController();
    void fetch(
      `/api/mapa/lesnictwa?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&radiusM=${promienWarstwLesnychM}`,
      { credentials: "include", signal: ctrl.signal },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (ctrl.signal.aborted || !data?.obrysy) return;
        ustawLesnictwaObrysy(data.obrysy as ObrysLesnictwaMapy[]);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted || czyPrzerwanyFetch(err)) return;
        ustawLesnictwaObrysy([]);
      });
    return () => {
      ctrl.abort();
    };
  }, [pokazLesnictwa, srodekObszaruMapy, promienWarstwLesnychM]);

  useEffect(() => {
    if (!pokazObwodyLowieckie || !srodekObszaruMapy || !wojSlugDlaObwodow) {
      ustawObwodyLowieckieObrysy([]);
      return;
    }
    const { lat, lon } = srodekObszaruMapy;
    const ctrl = new AbortController();
    void fetch(
      `/api/mapa/obwody-lowieckie?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}&radiusM=${promienWarstwLesnychM}&woj=${encodeURIComponent(wojSlugDlaObwodow)}`,
      { credentials: "include", signal: ctrl.signal },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (ctrl.signal.aborted || !data?.obrysy) return;
        ustawObwodyLowieckieObrysy(data.obrysy as ObrysObwoduLowieckiegoMapy[]);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted || czyPrzerwanyFetch(err)) return;
        ustawObwodyLowieckieObrysy([]);
      });
    return () => {
      ctrl.abort();
    };
  }, [pokazObwodyLowieckie, srodekObszaruMapy, promienWarstwLesnychM, wojSlugDlaObwodow]);

  const statystykiPoi = useMemo(() => obliczStatystykiPoiNaMapie(punktyPoi), [punktyPoi]);
  const kategoriePoi = statystykiPoi.kategorie;
  const liczbaLatarn = statystykiPoi.liczbaLatarn;
  const liczbaInwestycji = statystykiPoi.liczbaInwestycji;
  const liczbaWodyOsp = statystykiPoi.liczbaWodyOsp;
  const liczbaDroga = statystykiPoi.liczbaDroga;
  const liczbaUslug = statystykiPoi.liczbaUslug;
  const liczbaRatunekWoda = statystykiPoi.liczbaRatunekWoda;

  const indeksKategoriiPoi = useMemo(() => indeksKategoriiPoiPoWsi(punktyPoi), [punktyPoi]);

  const idWsiFiltrowanych = useMemo(() => new Set(odfiltrowane.map((z) => z.id)), [odfiltrowane]);

  const filtrujInwestycjeWidocznosc = useCallback(
    (lista: ZnacznikPoi[]) =>
      lista.filter((p) => {
        if (p.category.trim().toLowerCase() !== KATEGORIA_INWESTYCJA) return true;
        if (pokazZakonczoneInwestycje) return true;
        return p.investmentStatus?.trim().toLowerCase() !== "zakonczona";
      }),
    [pokazZakonczoneInwestycje],
  );

  const inwestycjeNaMapie = useMemo(
    () =>
      filtrujInwestycjeWidocznosc(
        punktyPoi.filter((p) => p.category.trim().toLowerCase() === KATEGORIA_INWESTYCJA),
      ),
    [punktyPoi, filtrujInwestycjeWidocznosc],
  );

  const srodekLanduse = useMemo(() => {
    if (odfiltrowane.length === 0) return null;
    const sample = odfiltrowane.slice(0, 5);
    const lat = sample.reduce((s, z) => s + z.lat, 0) / sample.length;
    const lon = sample.reduce((s, z) => s + z.lon, 0) / sample.length;
    const radiusM = Math.min(5500, Math.max(1800, 1200 + odfiltrowane.length * 350));
    return { lat, lon, radiusM };
  }, [odfiltrowane]);

  const filtrPoiEfektywny = useMemo(() => {
    if (!filtrPoi || filtrPoi === "wszystkie") return "wszystkie";
    if (
      filtrPoi === "transport" ||
      filtrPoi === "droga" ||
      filtrPoi === "uslugi" ||
      filtrPoi === "woda_osp"
    ) {
      return filtrPoi;
    }
    return kategoriePoi.includes(filtrPoi) ? filtrPoi : "wszystkie";
  }, [filtrPoi, kategoriePoi]);

  const punktyPoiPoKategorii = useMemo(() => {
    let lista: ZnacznikPoi[];
    if (filtrPoiEfektywny === "wszystkie") {
      lista = punktyPoi.filter((p) => {
        const k = p.category.trim().toLowerCase();
        if (trybLowiectwo) {
          return czyKategoriaPoiLowiecka(k);
        }
        const jestLatarnia = k === KATEGORIA_LATARNIA;
        return !jestLatarnia || pokazOswietlenie;
      });
    } else if (filtrPoiEfektywny === "transport") {
      lista = punktyPoi.filter((p) => nalezyDoGrupyPoi(p.category, KATEGORIE_POI_TRANSPORT));
    } else if (filtrPoiEfektywny === "droga") {
      lista = punktyPoi.filter((p) => nalezyDoGrupyPoi(p.category, KATEGORIE_POI_DROGA_NOCLEG));
    } else if (filtrPoiEfektywny === "uslugi") {
      lista = punktyPoi.filter((p) => nalezyDoGrupyPoi(p.category, KATEGORIE_POI_USLUGI));
    } else if (filtrPoiEfektywny === "woda_osp") {
      lista = punktyPoi.filter((p) => nalezyDoGrupyPoi(p.category, KATEGORIE_POI_RATUNEK_WODA));
    } else {
      lista = punktyPoi.filter((p) => p.category === filtrPoiEfektywny);
    }
    return filtrujInwestycjeWidocznosc(lista);
  }, [punktyPoi, filtrPoiEfektywny, pokazOswietlenie, filtrujInwestycjeWidocznosc, trybLowiectwo]);

  const punktyPoiFiltrowane = useMemo(
    () => punktyPoiPoKategorii.filter((p) => idWsiFiltrowanych.has(p.villageId)),
    [punktyPoiPoKategorii, idWsiFiltrowanych],
  );

  const punktyAdresyFiltrowane = useMemo(
    () => punktyAdresy.filter((a) => idWsiFiltrowanych.has(a.villageId)),
    [punktyAdresy, idWsiFiltrowanych],
  );

  const punktyCmentarzeFiltrowane = useMemo(
    () => punktyCmentarze.filter((c) => idWsiFiltrowanych.has(c.villageId)),
    [punktyCmentarze, idWsiFiltrowanych],
  );

  const punktyGeoKontekstFiltrowane = useMemo(
    () => punktyGeoKontekst.filter((g) => idWsiFiltrowanych.has(g.villageId)),
    [punktyGeoKontekst, idWsiFiltrowanych],
  );

  const punktyKolaFiltrowane = useMemo(
    () => punktyKola.filter((k) => idWsiFiltrowanych.has(k.villageId)),
    [punktyKola, idWsiFiltrowanych],
  );

  const punktyPolowaniaPosortowane = useMemo(
    () =>
      [...punktyPolowania]
        .filter((p) => idWsiFiltrowanych.has(p.villageId))
        .filter((p) => !tylkoAktywnePolowania || p.faza === "aktywne")
        .sort((a, b) => {
          if (a.faza !== b.faza) return a.faza === "aktywne" ? -1 : 1;
          return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
        }),
    [punktyPolowania, idWsiFiltrowanych, tylkoAktywnePolowania],
  );

  const rewiryFiltrowane = useMemo(
    () => rewiryLowieckie.filter((r) => idWsiFiltrowanych.has(r.villageId)),
    [rewiryLowieckie, idWsiFiltrowanych],
  );

  const liczbaPolowanAktywnych = useMemo(
    () => punktyPolowania.filter((p) => p.faza === "aktywne").length,
    [punktyPolowania],
  );

  const liczbaLesnychAktywnych = useMemo(
    () => ostrzezeniaLesne.filter((o) => o.faza === "aktywne").length,
    [ostrzezeniaLesne],
  );

  const wierszeListy = useMemo(() => {
    if (!pozycjaUzytkownika) return odfiltrowane;
    return [...odfiltrowane].sort(
      (a, b) =>
        odlegloscKm(pozycjaUzytkownika.lat, pozycjaUzytkownika.lon, a.lat, a.lon) -
        odlegloscKm(pozycjaUzytkownika.lat, pozycjaUzytkownika.lon, b.lat, b.lon),
    );
  }, [odfiltrowane, pozycjaUzytkownika]);

  const wierszeListyWidoczne = useMemo(
    () => wierszeListy.slice(0, limitListyWsi),
    [wierszeListy, limitListyWsi],
  );

  const animujListeWsi = wierszeListyWidoczne.length <= 36;

  const kluczZnacznikowMapy = useMemo(
    () => wierszeListy.map((z) => `${z.id}\t${z.lat}\t${z.lon}\t${z.public_offers_count}`).join("\n"),
    [wierszeListy],
  );

  /** Bez boundary_geojson — odświeżenie obrysów nie przebudowuje warstwy POI. */
  const znacznikiNaMape = useMemo(
    () => wierszeListy.map((z) => ({ ...z, boundary_geojson: null })),
    [kluczZnacznikowMapy],
  );

  const graniceWsiNaMapie = useMemo(() => {
    const o: Record<string, unknown> = {};
    for (const z of wierszeListy) {
      if (z.boundary_geojson) o[z.id] = z.boundary_geojson;
    }
    return o;
  }, [wierszeListy.map((z) => `${z.id}:${z.boundary_geojson ? "1" : "0"}`).join("|")]);

  const frazaDoPodswietlenia = tryb === "szukaj" ? szukajOdroczone.trim() : filtrNazwaOdroczony.trim();

  useEffect(() => {
    if (!trybLowiectwo) return;
    mapRef.current?.ustawPodklad("satelita");
  }, [trybLowiectwo]);

  const kompletnoscFiltru = useMemo(
    () =>
      obliczSredniaKompletnoscMapy(
        odfiltrowane.map((z) => ({
          id: z.id,
          name: z.name,
          boundary_geojson: z.boundary_geojson,
          latitude: z.lat,
          longitude: z.lon,
        })),
        indeksKategoriiPoi,
      ),
    [odfiltrowane, indeksKategoriiPoi],
  );

  const liczbaPoiTransportu = useMemo(() => {
    if (filtrPoiEfektywny !== "transport") return 0;
    return punktyPoiFiltrowane.length;
  }, [filtrPoiEfektywny, punktyPoiFiltrowane]);

  useEffect(() => {
    const zapisz = () => {
      const params = new URLSearchParams();
      for (const klucz of ["poiId", "wies", "polowanie", "les", "lat", "lon", "zoom"] as const) {
        const v = searchParams.get(klucz);
        if (v) params.set(klucz, v);
      }
      if (tryb === "szukaj" && szukaj.trim()) params.set("q", szukaj.trim());
      if (filtrAdmin.wojSlug) params.set("woj", filtrAdmin.wojSlug);
      if (filtrAdmin.powSlug) params.set("pow", filtrAdmin.powSlug);
      if (filtrAdmin.gminaSlug) params.set("gmina", filtrAdmin.gminaSlug);
      if (trybLowiectwo) params.set("warstwa", "lowiectwo");
      else if (filtrPoiEfektywny === "transport") params.set("warstwa", "transport");
      else if (filtrPoiEfektywny === "droga") params.set("warstwa", "droga");
      else if (filtrPoiEfektywny === "uslugi") params.set("warstwa", "uslugi");
      else if (filtrPoiEfektywny === "woda_osp") params.set("warstwa", "ratunek");
      else if (filtrPoiEfektywny === "ladne_miejsce") params.set("warstwa", "ladne");
      else if (filtrPoiEfektywny === KATEGORIA_LATARNIA) params.set("warstwa", "oswietlenie");
      else if (filtrPoiEfektywny === KATEGORIA_INWESTYCJA) params.set("warstwa", "inwestycje");
      else if (filtrPoiEfektywny !== "wszystkie") params.set("poi", filtrPoiEfektywny);
      else if (pokazOswietlenie) params.set("latarnie", "1");
      else params.delete("warstwa");
      if (pokazZagospodarowanie) params.set("zagospodarowanie", "1");
      else params.delete("zagospodarowanie");
      if (pokazZakonczoneInwestycje) params.set("inwest_zakonczone", "1");
      else params.delete("inwest_zakonczone");
      if (!pokazPolowania) params.set("polowania", "0");
      else params.delete("polowania");
      if (!pokazOstrzezeniaLesne) params.set("ostrzezenia_lesne", "0");
      else params.delete("ostrzezenia_lesne");
      if (pokazKola) params.set("kola", "1");
      else params.delete("kola");
      if (!pokazZgloszenia) params.set("zgloszenia", "0");
      else params.delete("zgloszenia");
      if (!pokazRynekMapa) params.set("rynek", "0");
      else params.delete("rynek");
      if (!pokazRynekDzialki) params.set("rynek_dzialki", "0");
      else params.delete("rynek_dzialki");
      if (!pokazPoiWarstwa) params.set("poi_warstwa", "0");
      else params.delete("poi_warstwa");
      if (!pokazCmentarze) params.set("cmentarze", "0");
      else params.delete("cmentarze");
      if (tylkoObrysPrg) params.set("obrys", "1");
      if (tylkoOferty) params.set("oferty", "1");
      if (pokazObrysGminy) params.set("gmina_obrys", "1");
      if (pokazObrysPowiatu) params.set("powiat_obrys", "1");
      if (pokazObrysWojewodztwa) params.set("woj_obrys", "1");
      if (!pokazGraniceWsi) params.set("granice_wsi", "0");
      if (!pokazGraniceDzialek) params.set("dzialki", "0");
      else params.delete("dzialki");
      if (pokazGraniceObrebow) params.set("obreby", "1");
      else params.delete("obreby");
      if (pokazNadlesnictwa) params.set("nadlesnictwa", "1");
      if (pokazLesnictwa) params.set("lesnictwa", "1");
      if (pokazObwodyLowieckie) params.set("obwody_lowieckie", "1");
      if (promienKm > 0) params.set("km", String(promienKm));
      if (pokazAdresyKin) params.set("adresy", "1");
      else params.delete("adresy");
      if (pokazGeoKontekst) params.set("geo_kontekst", "1");
      else params.delete("geo_kontekst");
      const query = params.toString();
      if (czyTenSamUrlMapy(pathname, query)) return;
      const url = query ? `${pathname}?${query}` : pathname;
      router.replace(url, { scroll: false });
    };
    const t = window.setTimeout(zapisz, 400);
    return () => window.clearTimeout(t);
    // searchParams celowo poza deps — unikamy pętli router.replace; deep linki odczytujemy w closure renderu.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync filtrów, nie reakcja na własny replace
  }, [
    tryb,
    szukaj,
    filtrAdmin,
    filtrPoiEfektywny,
    trybLowiectwo,
    pokazPolowania,
    pokazOstrzezeniaLesne,
    pokazKola,
    pokazZgloszenia,
    pokazRynekMapa,
    pokazRynekDzialki,
    pokazPoiWarstwa,
    pokazCmentarze,
    tylkoObrysPrg,
    tylkoOferty,
    pokazObrysGminy,
    pokazObrysPowiatu,
    pokazObrysWojewodztwa,
    pokazGraniceWsi,
    pokazGraniceDzialek,
    pokazGraniceObrebow,
    pokazNadlesnictwa,
    pokazLesnictwa,
    pokazObwodyLowieckie,
    promienKm,
    pokazOswietlenie,
    pokazZagospodarowanie,
    pokazZakonczoneInwestycje,
    pokazAdresyKin,
    pokazGeoKontekst,
    pathname,
    router,
  ]);

  useEffect(() => {
    if (wykonanoDeepLinkWsi.current) return;
    const idWsi = searchParams.get("wies");
    if (!idWsi || odfiltrowane.length === 0) return;
    if (!odfiltrowane.some((z) => z.id === idWsi)) return;
    wykonanoDeepLinkWsi.current = true;
    const t = window.setTimeout(() => mapRef.current?.pokazNaMapie(idWsi), 300);
    return () => window.clearTimeout(t);
  }, [searchParams, odfiltrowane]);

  useEffect(() => {
    const lat = Number.parseFloat(searchParams.get("lat") ?? "");
    const lon = Number.parseFloat(searchParams.get("lon") ?? "");
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const zoom = Number.parseInt(searchParams.get("zoom") ?? "14", 10);
    const t = window.setTimeout(() => {
      mapRef.current?.pokazPunkt(lat, lon, Number.isFinite(zoom) ? zoom : 14);
    }, 400);
    return () => window.clearTimeout(t);
  }, [searchParams]);

  useEffect(() => {
    if (wykonanoDeepLinkPolowania.current) return;
    const id = searchParams.get("polowanie");
    if (!id || !punktyPolowania.some((p) => p.id === id)) return;
    wykonanoDeepLinkPolowania.current = true;
    const t = window.setTimeout(() => mapRef.current?.pokazPolowanie(id), 450);
    return () => window.clearTimeout(t);
  }, [searchParams, punktyPolowania]);

  useEffect(() => {
    if (wykonanoDeepLinkLesne.current) return;
    const id = searchParams.get("les");
    if (!id || !ostrzezeniaLesne.some((o) => o.id === id)) return;
    wykonanoDeepLinkLesne.current = true;
    ustawPokazOstrzezeniaLesne(true);
    const t = window.setTimeout(() => mapRef.current?.pokazOstrzezenieLesne(id), 450);
    return () => window.clearTimeout(t);
  }, [searchParams, ostrzezeniaLesne]);

  useEffect(() => {
    if (wykonanoDeepLinkPoi.current) return;
    const id = odczytajIdPoiZParametrow(searchParams);
    if (!id || !punktyPoi.some((p) => p.id === id)) return;
    wykonanoDeepLinkPoi.current = true;
    const t = window.setTimeout(() => mapRef.current?.pokazPoi(id), 450);
    return () => window.clearTimeout(t);
  }, [searchParams, punktyPoi]);

  useEffect(() => {
    if (!pokazZagospodarowanie || !srodekLanduse) {
      ustawObrysyLanduse([]);
      ustawStatusLanduse("idle");
      ustawBladLanduse("");
      return;
    }
    let cancelled = false;
    ustawStatusLanduse("wczytuje");
    ustawBladLanduse("");
    const ctrl = new AbortController();
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const q = new URLSearchParams({
            lat: String(srodekLanduse.lat),
            lon: String(srodekLanduse.lon),
            radiusM: String(srodekLanduse.radiusM),
          });
          const res = await fetch(`/api/mapa/landuse?${q.toString()}`, {
            credentials: "include",
            signal: ctrl.signal,
          });
          if (cancelled) return;
          if (!res.ok) {
            const j = (await res.json().catch(() => ({}))) as { blad?: string };
            ustawBladLanduse(j.blad ?? "Nie udało się wczytać warstwy zagospodarowania.");
            ustawObrysyLanduse([]);
            ustawStatusLanduse("blad");
            return;
          }
          const json = (await res.json()) as {
            obrysy?: { id: string; landuse: string; name: string | null; geojson: GeoJSON.Polygon }[];
          };
          ustawObrysyLanduse(json.obrysy ?? []);
          ustawStatusLanduse("ok");
        } catch (e) {
          if (cancelled || (e instanceof DOMException && e.name === "AbortError")) return;
          ustawBladLanduse("Błąd połączenia z serwerem mapy.");
          ustawStatusLanduse("blad");
        }
      })();
    }, 350);
    return () => {
      cancelled = true;
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [pokazZagospodarowanie, srodekLanduse]);

  const ladneMiejsca = useMemo(
    () => punktyPoi.filter((p) => p.category === "ladne_miejsce" && p.photoUrl),
    [punktyPoi],
  );

  const punktyPolowaniaWidoczne = pokazPolowania ? punktyPolowaniaPosortowane : [];
  const ostrzezeniaLesneWidoczne = pokazOstrzezeniaLesne ? ostrzezeniaLesne : [];
  const punktyKolaWidoczne = pokazKola ? punktyKolaFiltrowane : [];
  const punktyZgloszeniaWidoczne = pokazZgloszenia ? punktyZgloszenia : [];
  const punktyRynekWidoczne = pokazRynekMapa ? punktyRynek : [];
  const punktyRynekDzialkiWidoczne =
    pokazRynekMapa && pokazRynekDzialki ? punktyRynekDzialki : [];
  const punktyCmentarzeWidoczne = pokazCmentarze ? punktyCmentarzeFiltrowane : [];

  const ustawiaczeWarstw = useMemo(
    (): UstawiaczeWarstw => ({
      ustawTrybLowiectwo,
      ustawPokazPolowania,
      ustawPokazOstrzezeniaLesne,
      ustawPokazKola,
      ustawPokazZgloszenia,
      ustawPokazRynekMapa,
      ustawPokazRynekDzialki,
      ustawPokazGraniceWsi,
      ustawPokazGraniceDzialek,
      ustawPokazGraniceObrebow,
      ustawPokazObrysGminy,
      ustawPokazObrysPowiatu,
      ustawPokazObrysWojewodztwa,
      ustawPokazNadlesnictwa,
      ustawPokazLesnictwa,
      ustawPokazObwodyLowieckie,
      ustawPokazZagospodarowanie,
      ustawPokazAdresyKin,
      ustawPokazGeoKontekst,
      ustawPokazPoiWarstwa,
      ustawPokazCmentarze,
      ustawPokazOswietlenie,
      setFiltrPoi,
      ustawTylkoObrysPrg,
      ustawTylkoOferty,
      ustawPromienKm,
      ustawPodklad: (rodzaj) => mapRef.current?.ustawPodklad(rodzaj),
    }),
    [],
  );

  const stanWarstwPanelu = useMemo(
    () => ({
      trybLowiectwo,
      pokazPolowania,
      pokazOstrzezeniaLesne,
      pokazKola,
      pokazZgloszenia,
      pokazRynekMapa,
      pokazRynekDzialki,
      pokazGraniceWsi,
      pokazGraniceDzialek,
      pokazGraniceObrebow,
      pokazObrysGminy,
      pokazObrysPowiatu,
      pokazObrysWojewodztwa,
      pokazNadlesnictwa,
      pokazLesnictwa,
      pokazObwodyLowieckie,
      pokazZagospodarowanie,
      pokazAdresyKin,
      pokazGeoKontekst,
      pokazPoiWarstwa,
      pokazCmentarze,
      pokazOswietlenie,
      filtrPoi: filtrPoiEfektywny,
      tylkoObrysPrg,
      tylkoOferty,
      promienKm,
      tylkoAktywnePolowania,
      pokazZakonczoneInwestycje,
    }),
    [
      trybLowiectwo,
      pokazPolowania,
      pokazOstrzezeniaLesne,
      pokazKola,
      pokazZgloszenia,
      pokazRynekMapa,
      pokazRynekDzialki,
      pokazGraniceWsi,
      pokazGraniceDzialek,
      pokazGraniceObrebow,
      pokazObrysGminy,
      pokazObrysPowiatu,
      pokazObrysWojewodztwa,
      pokazNadlesnictwa,
      pokazLesnictwa,
      pokazObwodyLowieckie,
      pokazZagospodarowanie,
      pokazAdresyKin,
      pokazGeoKontekst,
      pokazPoiWarstwa,
      pokazCmentarze,
      pokazOswietlenie,
      filtrPoiEfektywny,
      tylkoObrysPrg,
      tylkoOferty,
      promienKm,
      tylkoAktywnePolowania,
      pokazZakonczoneInwestycje,
    ],
  );

  const liczbaWarstwAktywnych = useMemo(() => liczAktywneWarstwy(stanWarstwPanelu), [stanWarstwPanelu]);

  const widokWOkolicy = useCallback(() => {
    zastosujPresetWarstw("dzialka", ustawiaczeWarstw);
    ustawPromienKm(25);
    window.setTimeout(() => mapRef.current?.przyblizDoUzytkownika(), 200);
  }, [ustawiaczeWarstw]);

  const zastosujPreset = useCallback(
    (preset: PresetWarstwMapy) => {
      if (preset !== "wlasny") zastosujPresetWarstw(preset, ustawiaczeWarstw);
    },
    [ustawiaczeWarstw],
  );

  const wyczyscSzukaj = useCallback(() => {
    setSzukaj("");
  }, []);

  const wyczyscFiltry = useCallback(() => {
    setSzukaj("");
    ustawFiltrNazwa("");
    ustawFiltrAdmin({ wojSlug: "", powSlug: "", gminaSlug: "" });
    ustawTylkoObrysPrg(false);
    ustawTylkoOferty(false);
    ustawPromienKm(0);
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const naMapie = useCallback((id: string) => {
    mapRef.current?.pokazNaMapie(id);
  }, []);

  const wlaczLokalizacje = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatusGps("blad");
      return;
    }
    setStatusGps("wczytuje");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const poz = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setPozycjaUzytkownika(poz);
        setStatusGps("ok");
        window.setTimeout(() => mapRef.current?.przyblizDoUzytkownika(), 200);
      },
      () => {
        setStatusGps("blad");
        setPozycjaUzytkownika(null);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 },
    );
  }, []);

  const wylaczGps = useCallback(() => {
    setPozycjaUzytkownika(null);
    setStatusGps("idle");
    ustawPromienKm(0);
  }, []);

  const kopiujLinkMapy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      ustawKopiujLink("ok");
      window.setTimeout(() => ustawKopiujLink("idle"), 2000);
    } catch {
      ustawKopiujLink("blad");
      window.setTimeout(() => ustawKopiujLink("idle"), 2000);
    }
  }, []);

  const kluczListy = `${frazaDoPodswietlenia}|${pozycjaUzytkownika ? "gps" : "nogps"}|${filtrAdmin.gminaSlug}`;

  useEffect(() => {
    ustawLimitListyWsi(LIMIT_LISTY_WSI);
  }, [kluczListy]);

  const pokazDomyslnyBanner = czyDomyslnyFiltrPowiatu(filtrAdmin);
  const graniceWsiAktywne =
    pokazGraniceWsi && zoomMapy >= MIN_ZOOM_GRANICE_WSI;

  const wyczyscDoCalejPolski = useCallback(() => {
    ustawFiltrAdmin({ wojSlug: "", powSlug: "", gminaSlug: "" });
    onRozszerzDoPolski?.();
  }, [onRozszerzDoPolski]);

  if (!klientGotowy) {
    return (
      <div
        className="flex h-full min-h-0 flex-1 flex-col items-center justify-center bg-stone-50/80"
        role="status"
        aria-live="polite"
        aria-label="Ładowanie mapy"
      >
        <p className="text-sm font-medium text-green-900/80">Ładowanie mapy…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {panelFiltrOtwarty ? (
        <button
          type="button"
          className="fixed inset-0 z-[45] border-0 bg-green-950/25 backdrop-blur-[1px] lg:hidden"
          aria-label="Zamknij filtry mapy"
          onClick={() => ustawPanelFiltrOtwarty(false)}
        />
      ) : null}

      {!panelFiltrOtwarty ? (
        <button
          type="button"
          className="mapa-fab-filtry lg:hidden"
          aria-expanded={false}
          onClick={() => ustawPanelFiltrOtwarty(true)}
        >
          <>
            <span className="mapa-fab-filtry__glowny">Warstwy ({liczbaWarstwAktywnych})</span>
            <span className="mapa-fab-filtry__dopisek">{odfiltrowane.length} wsi w widoku</span>
          </>
        </button>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col lg:h-full lg:flex-row lg:items-stretch">
      <aside
        className={`${
          panelFiltrOtwarty ? "fixed inset-x-0 z-[46] flex rounded-t-2xl border-t border-stone-200/90 shadow-[0_-12px_40px_rgba(45,90,45,0.14)]" : "hidden"
        } mapa-panel-filtry-sheet shrink-0 flex-col bg-gradient-to-b from-white via-white to-emerald-50/25 backdrop-blur-md lg:relative lg:flex lg:max-h-none lg:h-full lg:w-[min(100%,320px)] xl:w-[min(100%,340px)] lg:rounded-none lg:border-r lg:border-t-0 lg:border-stone-200/60 lg:shadow-none`}
      >
        <div className="mapa-sidebar-naglowek">
          <div className="mb-2 flex items-center justify-between gap-2 lg:hidden">
            <span className="mapa-panel-filtry-sheet__uchwyt" aria-hidden />
            <button
              type="button"
              className="rounded-lg px-2.5 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-100"
              onClick={() => ustawPanelFiltrOtwarty(false)}
            >
              Zamknij
            </button>
          </div>
          <div className="mapa-segment-kontrolka" role="tablist" aria-label="Sposób wyboru wsi">
            <button
              type="button"
              role="tab"
              aria-selected={tryb === "katalog"}
              className={`mapa-segment-kontrolka__btn ${
                tryb === "katalog" ? "mapa-segment-kontrolka__btn--aktywny" : "mapa-segment-kontrolka__btn--nieaktywny"
              }`}
              onClick={() => ustawTryb("katalog")}
            >
              Katalog
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tryb === "szukaj"}
              className={`mapa-segment-kontrolka__btn ${
                tryb === "szukaj" ? "mapa-segment-kontrolka__btn--aktywny" : "mapa-segment-kontrolka__btn--nieaktywny"
              }`}
              onClick={() => ustawTryb("szukaj")}
            >
              Szukaj
            </button>
          </div>

          {tryb === "katalog" ? (
            <>
              <MapaFiltrAdministracyjny znaczniki={znaczniki} filtr={filtrAdmin} onZmiana={ustawFiltrAdmin} />
              <div className="mt-2">
                <label htmlFor="mapa-filtr-nazwa" className="sr-only">
                  Filtruj miejscowości po nazwie
                </label>
                <input
                  id="mapa-filtr-nazwa"
                  type="search"
                  value={filtrNazwa}
                  onChange={(e) => ustawFiltrNazwa(e.target.value)}
                  placeholder="Filtruj po nazwie wsi…"
                  className="min-h-[40px] w-full rounded-xl border border-stone-200/90 bg-white/90 px-3 py-2 text-sm text-stone-900 shadow-sm outline-none ring-green-800/20 focus:border-green-600 focus:ring-2"
                />
              </div>
            </>
          ) : (
            <>
              <label htmlFor="mapa-szukaj" className="sr-only">
                Szukaj wsi po nazwie lub miejscu
              </label>
              <div className="flex gap-2">
                <input
                  id="mapa-szukaj"
                  type="search"
                  value={szukaj}
                  onChange={(e) => setSzukaj(e.target.value)}
                  placeholder="Nazwa wsi, gmina, powiat…"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-xl border border-stone-200/90 bg-white/90 px-3 py-2.5 text-sm text-stone-900 shadow-sm outline-none ring-green-800/20 focus:border-green-600 focus:ring-2"
                />
                {szukaj.trim() ? (
                  <button
                    type="button"
                    onClick={wyczyscSzukaj}
                    className="shrink-0 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700"
                  >
                    Wyczyść
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>

        <div className="mapa-sidebar-przewijanie">
          <MapaPanelWarstw
            filtrAdmin={filtrAdmin}
            zoomMapy={zoomMapy}
            liczbaPolowanAktywnych={liczbaPolowanAktywnych}
            liczbaLesnychAktywnych={liczbaLesnychAktywnych}
            liczbaKol={punktyKola.length}
            liczbaAdresyKin={punktyAdresyFiltrowane.length}
            liczbaGeoKontekst={punktyGeoKontekstFiltrowane.length}
            liczbaCmentarzy={punktyCmentarzeFiltrowane.length}
            liczbaInwestycji={liczbaInwestycji}
            liczbaLatarn={liczbaLatarn}
            liczbaDroga={liczbaDroga}
            liczbaUslug={liczbaUslug}
            liczbaRatunekWoda={liczbaRatunekWoda}
            liczbaWodyOsp={liczbaWodyOsp}
            filtrPoiEfektywny={filtrPoiEfektywny}
            kategoriePoi={kategoriePoi}
            etykietaKategoriiPoi={etykietaKategoriiPoi}
            kompletnoscSrednia={kompletnoscFiltru}
            liczbaWsiFiltr={odfiltrowane.length}
            stan={stanWarstwPanelu}
            ustaw={{
              ...ustawiaczeWarstw,
              ustawTylkoAktywnePolowania,
              ustawPokazZakonczoneInwestycje,
            }}
            onPreset={zastosujPreset}
            onWlasny={() => {}}
            onWidokWOkolicy={widokWOkolicy}
            maGps={Boolean(pozycjaUzytkownika)}
          />

          <p className="mapa-statystyka-panelu">
            Wyświetlono <strong className="text-stone-800">{odfiltrowane.length}</strong> z {znaczniki.length} wsi.
            Ustawienia zapisują się w adresie — możesz wysłać link.
          </p>

          <div className="mapa-panel-akcje">
            <div className="mapa-panel-akcje__rzad">
              {pozycjaUzytkownika ? (
                <>
                  <button
                    type="button"
                    onClick={() => mapRef.current?.przyblizDoUzytkownika()}
                    className="mapa-btn-akcja mapa-btn-akcja--gps"
                  >
                    📍 Przybliż do mnie
                  </button>
                  <button type="button" onClick={wylaczGps} className="mapa-btn-akcja mapa-btn-akcja--secondary">
                    Wyłącz GPS
                  </button>
                  <select
                    value={promienKm}
                    onChange={(e) => ustawPromienKm(Number.parseInt(e.target.value, 10) || 0)}
                    className="mapa-select-panel min-h-[32px] w-auto shrink-0"
                    aria-label="Promień od lokalizacji"
                  >
                    <option value={0}>Bez limitu km</option>
                    <option value={10}>Do 10 km</option>
                    <option value={25}>Do 25 km</option>
                    <option value={50}>Do 50 km</option>
                    <option value={100}>Do 100 km</option>
                  </select>
                </>
              ) : (
                <button
                  type="button"
                  onClick={wlaczLokalizacje}
                  disabled={statusGps === "wczytuje"}
                  className="mapa-btn-akcja mapa-btn-akcja--primary disabled:opacity-60"
                >
                  {statusGps === "wczytuje" ? "Pobieranie GPS…" : "📍 Moja lokalizacja"}
                </button>
              )}
              <button
                type="button"
                onClick={() => void kopiujLinkMapy()}
                className="mapa-btn-akcja mapa-btn-akcja--secondary"
              >
                {kopiujLink === "ok" ? "Skopiowano!" : kopiujLink === "blad" ? "Błąd" : "Kopiuj link"}
              </button>
              {(filtrAdmin.wojSlug || szukaj.trim() || tylkoObrysPrg || tylkoOferty || promienKm > 0) && (
                <button type="button" onClick={wyczyscFiltry} className="mapa-btn-akcja mapa-btn-akcja--warn">
                  Wyczyść filtry
                </button>
              )}
            </div>
            {statusGps === "blad" ? (
              <p className="mt-2 text-[11px] text-amber-800">Brak zgody na lokalizację.</p>
            ) : null}
          </div>


          <div className="mapa-lista-wsi-naglowek mt-4">
            <span className="mapa-lista-wsi-naglowek__tytul">Lista wsi</span>
            <span className="mapa-lista-wsi-naglowek__liczba">
              {wierszeListy.length}
              {wierszeListy.length !== wierszeListyWidoczne.length
                ? ` · ${wierszeListyWidoczne.length} na liście`
                : ""}
            </span>
          </div>
          {pokazDomyslnyBanner ? (
            <p className="mb-2 rounded-lg border border-emerald-200/80 bg-emerald-50/90 px-2.5 py-2 text-[11px] leading-snug text-emerald-950">
              Startujesz od <strong>powiatu nakielskiego</strong> — mapa działa płynniej.{" "}
              <button
                type="button"
                className="font-medium underline disabled:opacity-60"
                disabled={ladowaniePelnejPolski}
                onClick={wyczyscDoCalejPolski}
              >
                {ladowaniePelnejPolski ? "Wczytuję całą Polskę…" : "Pokaż całą Polskę"}
              </button>
            </p>
          ) : null}
          <ul key={kluczListy} className="space-y-1.5 pb-2">
          {wierszeListyWidoczne.length === 0 ? (
            <li className="mapa-sidebar-pusty">
              Brak wsi pasujących do filtrów.{" "}
              <button type="button" className="font-medium text-green-900 underline" onClick={wyczyscFiltry}>
                Wyczyść filtry
              </button>{" "}
              albo wybierz inną gminę w katalogu. Pełna wyszukiwarka:{" "}
              <Link href="/szukaj" className="font-medium text-green-900 underline">
                Szukaj wsi
              </Link>
              .
            </li>
          ) : (
            wierszeListyWidoczne.map((z, index) => {
              const km = pozycjaUzytkownika
                ? Math.round(odlegloscKm(pozycjaUzytkownika.lat, pozycjaUzytkownika.lon, z.lat, z.lon))
                : null;
              const admin = [z.commune, z.county, z.voivodeship].filter(Boolean).join(" · ") || "—";
              return (
                <li
                  key={z.id}
                  className={
                    animujListeWsi
                      ? "opacity-0 animate-mapa-row motion-reduce:animate-none motion-reduce:opacity-100"
                      : undefined
                  }
                  style={animujListeWsi ? { animationDelay: `${Math.min(index, 18) * 38}ms` } : undefined}
                >
                  <div className="mapa-karta-wsi">
                    <button
                      type="button"
                      onClick={() => naMapie(z.id)}
                      className="mapa-karta-wsi__mapa"
                      title="Przybliż mapę i otwórz opis wsi"
                      aria-label={`Pokaż ${z.name} na mapie`}
                    >
                      📍
                    </button>
                    <Link href={z.sciezka} className="mapa-karta-wsi__link">
                      <span className="mapa-karta-wsi__nazwa">
                        {podswietlDopasowanie(z.name, frazaDoPodswietlenia)}
                      </span>
                      <span className="mapa-karta-wsi__meta">
                        {frazaDoPodswietlenia ? podswietlDopasowanie(admin, frazaDoPodswietlenia) : admin}
                      </span>
                      <span className="mapa-karta-wsi__odznaki">
                        {km != null ? (
                          <span className="mapa-karta-wsi__odznaka mapa-karta-wsi__odznaka--km">{km} km</span>
                        ) : null}
                        {z.public_offers_count > 0 ? (
                          <span className="mapa-karta-wsi__odznaka mapa-karta-wsi__odznaka--oferty">
                            {z.public_offers_count} ofert
                          </span>
                        ) : null}
                        <span
                          className={`mapa-karta-wsi__odznaka ${wiesMaObrys(z) ? "mapa-karta-wsi__odznaka--prg" : "mapa-karta-wsi__odznaka--szacunek"}`}
                        >
                          {wiesMaObrys(z) ? "obrys PRG" : "szacunek"}
                        </span>
                      </span>
                    </Link>
                  </div>
                </li>
              );
            })
          )}

          {wierszeListy.length > wierszeListyWidoczne.length ? (
            <li className="pt-1">
              <button
                type="button"
                className="w-full rounded-lg border border-green-900/12 bg-white px-3 py-2 text-xs font-medium text-green-900 hover:bg-green-50"
                onClick={() => ustawLimitListyWsi((n) => n + LIMIT_LISTY_WSI)}
              >
                Pokaż więcej ({wierszeListy.length - wierszeListyWidoczne.length} pozostało)
              </button>
            </li>
          ) : null}

          <MapaSidebarSkroty
            pokazZagospodarowanie={pokazZagospodarowanie}
            statusLanduse={statusLanduse}
            bladLanduse={bladLanduse}
            obrysyLanduseLen={obrysyLanduse.length}
            filtrTransportPusty={filtrPoiEfektywny === "transport" && liczbaPoiTransportu === 0 && odfiltrowane.length > 0}
            trybLowiectwo={trybLowiectwo}
            rewiryCount={rewiryFiltrowane.length}
            liczbaInwestycji={liczbaInwestycji}
            liczbaLatarn={liczbaLatarn}
            linkHubGminy={linkHubGminy}
            pokazLegendeSymboli={
              punktyZgloszenia.length > 0 || punktyPolowania.length > 0 || ostrzezeniaLesne.length > 0 || punktyKola.length > 0
            }
            inwestycje={inwestycjeNaMapie.slice(0, 12).map((p) => ({
              id: p.id,
              name: p.name,
              villageName: p.villageName,
              badge: etykietaStatusuInwestycji(p.investmentStatus) ?? undefined,
              ikona: "🏗",
              onClick: () => mapRef.current?.pokazPoi(p.id),
            }))}
            ladneMiejsca={ladneMiejsca.map((p) => ({
              id: p.id,
              name: p.name,
              villageName: p.villageName,
              ikona: "✨",
              onClick: () => mapRef.current?.pokazPoi(p.id),
            }))}
            kola={
              pokazKola
                ? punktyKolaFiltrowane.slice(0, 16).map((k) => ({
                    id: k.id,
                    name: k.name,
                    villageName: k.villageName,
                    ikona: "🦌",
                    onClick: () => mapRef.current?.pokazPunkt(k.lat, k.lon, 14),
                  }))
                : []
            }
            polowania={punktyPolowaniaPosortowane}
            listaPolowan={
              punktyPolowaniaPosortowane.length > 0 ? (
                <ListaPolowanSidebar
                  polowania={punktyPolowaniaPosortowane}
                  klientGotowy={klientGotowy}
                  onPokaz={(id) => mapRef.current?.pokazPolowanie(id)}
                />
              ) : null
            }
          />

          </ul>
        </div>
      </aside>

      <div className="mapa-widget-pelny relative flex min-h-0 flex-1 flex-col bg-stone-200/40">
        {odfiltrowane.length === 0 ? (
          <div className="mapa-pusty-widok">
            <p className="mapa-pusty-widok__tytul">Brak wsi w tym widoku</p>
            <p className="mapa-pusty-widok__opis">
              Zmień filtry, wybierz inną gminę albo wyczyść ograniczenia promienia GPS.
            </p>
            <button
              type="button"
              className="mapa-btn-akcja mapa-btn-akcja--primary"
              onClick={() => ustawPanelFiltrOtwarty(true)}
            >
              Otwórz panel warstw
            </button>
          </div>
        ) : (
          <div className="relative flex min-h-0 flex-1 flex-col">
            <MapaLowiectwoOverlay
              widoczne={trybLowiectwo || pokazPolowania}
              polowania={punktyPolowaniaWidoczne}
              liczbaKol={punktyKolaWidoczne.length}
              liczbaRewirow={rewiryFiltrowane.length}
              onPokazAktywne={() => {
                const pierwsze = punktyPolowaniaWidoczne.find((p) => p.faza === "aktywne");
                if (pierwsze) mapRef.current?.pokazPolowanie(pierwsze.id);
              }}
            />
            <div className="mapa-fab-pasek absolute left-2 z-[415] flex flex-col gap-1.5 sm:left-3">
              <button
                type="button"
                onClick={() => ustawPanelFiltrOtwarty(true)}
                className="mapa-fab-btn lg:hidden"
                title={`Warstwy mapy (${liczbaWarstwAktywnych})`}
                aria-label={`Otwórz panel warstw, ${liczbaWarstwAktywnych} aktywnych`}
              >
                🗺
              </button>
              <button
                type="button"
                onClick={() => {
                  if (pozycjaUzytkownika) {
                    mapRef.current?.przyblizDoUzytkownika();
                  } else {
                    wlaczLokalizacje();
                  }
                }}
                disabled={statusGps === "wczytuje"}
                className={`mapa-fab-btn ${pozycjaUzytkownika ? "mapa-fab-btn--aktywny" : ""}`}
                title={pozycjaUzytkownika ? "Przybliż do mojej lokalizacji" : "Włącz GPS"}
                aria-label={pozycjaUzytkownika ? "Przybliż do mojej lokalizacji" : "Włącz GPS"}
              >
                {statusGps === "wczytuje" ? "…" : "📍"}
              </button>
              <button
                type="button"
                onClick={() => mapRef.current?.przyblizDoWszystkich()}
                className="mapa-fab-btn"
                title="Pokaż wszystkie wsi w widoku"
                aria-label="Dopasuj widok do wszystkich wsi"
              >
                ⊞
              </button>
            </div>
            <MapaEgibToast
              widoczny={
                CZY_KIEG_WMS_DOSTEPNY &&
                (pokazGraniceDzialek || pokazGraniceObrebow) &&
                zoomMapy < KIEG_WMS_MIN_ZOOM
              }
              zoomMapy={zoomMapy}
              onPrzybliz={() => {
                const cel = pozycjaUzytkownika ?? (odfiltrowane[0] ? { lat: odfiltrowane[0].lat, lon: odfiltrowane[0].lon } : null);
                if (cel) mapRef.current?.pokazPunkt(cel.lat, cel.lon, KIEG_WMS_MIN_ZOOM);
              }}
            />
            <MapaWsiLeaflet
              ref={mapRef}
              znaczniki={znacznikiNaMape}
              graniceWsi={graniceWsiNaMapie}
              punktyPoi={punktyPoiFiltrowane}
              punktyAdresy={punktyAdresyFiltrowane}
              punktyRynek={punktyRynekWidoczne}
              punktyRynekDzialki={punktyRynekDzialkiWidoczne}
              punktyZgloszenia={punktyZgloszeniaWidoczne}
              punktyPolowania={punktyPolowaniaWidoczne}
              ostrzezeniaLesne={ostrzezeniaLesneWidoczne}
              punktyKola={punktyKolaWidoczne}
              rewiryLowieckie={rewiryFiltrowane}
              trybLowiectwo={trybLowiectwo}
              punktyCmentarze={punktyCmentarzeWidoczne}
              pokazPoi={pokazPoiWarstwa}
              pokazRynek={pokazRynekMapa}
              sterowanieWarstwZewnetrzne
              onZoomChange={ustawZoomMapy}
              punktyGeoKontekst={punktyGeoKontekstFiltrowane}
              obrysyGminy={pokazObrysGminy && !obrysGminyUrzedowy ? obrysyGminy : []}
              obrysGminyUrzedowy={pokazObrysGminy ? obrysGminyUrzedowy : null}
              obrysPowiatu={obrysPowiatuDoMapy}
              obrysWojewodztwa={obrysWojewodztwaDoMapy}
              nadlesnictwaObrysy={pokazNadlesnictwa ? nadlesnictwaObrysy : []}
              lesnictwaObrysy={pokazLesnictwa ? lesnictwaObrysy : []}
              obwodyLowieckieObrysy={pokazObwodyLowieckie ? obwodyLowieckieObrysy : []}
              pokazGranice={graniceWsiAktywne}
              onPokazGraniceChange={ustawPokazGraniceWsi}
              onBoundsChange={ustawBboxWidoku}
              bboxWidoku={bboxWidoku}
              pokazGraniceDzialek={pokazGraniceDzialek}
              onPokazGraniceDzialekChange={ustawPokazGraniceDzialek}
              pokazGraniceObrebow={pokazGraniceObrebow}
              onPokazGraniceObrebowChange={ustawPokazGraniceObrebow}
              obrysyLanduse={obrysyLanduse}
              pokazLanduse={pokazZagospodarowanie}
              pozycjaUzytkownika={pozycjaUzytkownika}
              promienKm={promienKm > 0 ? promienKm : null}
              pokazAdresyKin={pokazAdresyKin}
              onPokazAdresyKinChange={ustawPokazAdresyKin}
              pokazGeoKontekst={pokazGeoKontekst}
              onPokazGeoKontekstChange={ustawPokazGeoKontekst}
            />
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
