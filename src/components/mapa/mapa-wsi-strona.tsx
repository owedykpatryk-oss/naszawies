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
import { etykietaKategoriiPoi } from "@/lib/mapa/kategorie-poi";
import {
  filtrujZnacznikiAdministracyjnie,
  MapaFiltrAdministracyjny,
  type FiltrAdministracyjny,
} from "@/components/mapa/mapa-filtr-administracyjny";
import {
  MapaWsiLeaflet,
  type MapaWsiLeafletRef,
  type ZnacznikPoi,
  type ZnacznikRynek,
  type ZnacznikWsi,
} from "./mapa-wsi-leaflet";

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

export function MapaWsiStrona({
  znaczniki,
  punktyPoi = [],
  punktyRynek = [],
}: {
  znaczniki: ZnacznikWsi[];
  punktyPoi?: ZnacznikPoi[];
  punktyRynek?: ZnacznikRynek[];
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const mapRef = useRef<MapaWsiLeafletRef>(null);

  const [tryb, ustawTryb] = useState<TrybSidebara>(() =>
    searchParams.get("q")?.trim() ? "szukaj" : "katalog",
  );
  const [szukaj, setSzukaj] = useState(() => searchParams.get("q") ?? "");
  const [filtrPoi, setFiltrPoi] = useState(() => searchParams.get("poi") ?? "wszystkie");
  const [filtrAdmin, ustawFiltrAdmin] = useState<FiltrAdministracyjny>(() => ({
    wojSlug: searchParams.get("woj") ?? "",
    powSlug: searchParams.get("pow") ?? "",
    gminaSlug: searchParams.get("gmina") ?? "",
  }));
  const [filtrNazwa, ustawFiltrNazwa] = useState("");
  const [tylkoObrysPrg, ustawTylkoObrysPrg] = useState(searchParams.get("obrys") === "1");
  const [tylkoOferty, ustawTylkoOferty] = useState(searchParams.get("oferty") === "1");
  const [promienKm, ustawPromienKm] = useState<number>(() => {
    const raw = searchParams.get("km");
    const n = raw ? Number.parseInt(raw, 10) : 0;
    return PROMIENIE_KM.includes(n as (typeof PROMIENIE_KM)[number]) ? n : 0;
  });

  const szukajOdroczone = useDeferredValue(szukaj);
  const filtrNazwaOdroczony = useDeferredValue(filtrNazwa);
  const [pozycjaUzytkownika, setPozycjaUzytkownika] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [statusGps, setStatusGps] = useState<"idle" | "wczytuje" | "blad" | "ok">("idle");
  const [kopiujLink, ustawKopiujLink] = useState<"idle" | "ok" | "blad">("idle");
  const wykonanoDeepLinkWsi = useRef(false);

  const poAdministracji = useMemo(
    () => filtrujZnacznikiAdministracyjnie(znaczniki, filtrAdmin),
    [znaczniki, filtrAdmin],
  );

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
    if (tylkoObrysPrg) lista = lista.filter((z) => z.boundary_geojson != null);
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

  const kategoriePoi = useMemo(
    () => Array.from(new Set(punktyPoi.map((p) => p.category))).sort((a, b) => a.localeCompare(b, "pl")),
    [punktyPoi],
  );

  const filtrPoiEfektywny = useMemo(() => {
    if (!filtrPoi || filtrPoi === "wszystkie") return "wszystkie";
    return kategoriePoi.includes(filtrPoi) ? filtrPoi : "wszystkie";
  }, [filtrPoi, kategoriePoi]);

  const punktyPoiPoKategorii = useMemo(() => {
    if (filtrPoiEfektywny === "wszystkie") return punktyPoi;
    return punktyPoi.filter((p) => p.category === filtrPoiEfektywny);
  }, [punktyPoi, filtrPoiEfektywny]);

  const punktyPoiFiltrowane = useMemo(() => {
    const idWsi = new Set(odfiltrowane.map((z) => z.id));
    return punktyPoiPoKategorii.filter((p) => idWsi.has(p.villageId));
  }, [punktyPoiPoKategorii, odfiltrowane]);

  const wierszeListy = useMemo(() => {
    if (!pozycjaUzytkownika) return odfiltrowane;
    return [...odfiltrowane].sort(
      (a, b) =>
        odlegloscKm(pozycjaUzytkownika.lat, pozycjaUzytkownika.lon, a.lat, a.lon) -
        odlegloscKm(pozycjaUzytkownika.lat, pozycjaUzytkownika.lon, b.lat, b.lon),
    );
  }, [odfiltrowane, pozycjaUzytkownika]);

  const frazaDoPodswietlenia = tryb === "szukaj" ? szukajOdroczone.trim() : filtrNazwaOdroczony.trim();

  useEffect(() => {
    const zapisz = () => {
      const params = new URLSearchParams();
      if (tryb === "szukaj" && szukaj.trim()) params.set("q", szukaj.trim());
      if (filtrAdmin.wojSlug) params.set("woj", filtrAdmin.wojSlug);
      if (filtrAdmin.powSlug) params.set("pow", filtrAdmin.powSlug);
      if (filtrAdmin.gminaSlug) params.set("gmina", filtrAdmin.gminaSlug);
      if (filtrPoiEfektywny !== "wszystkie") params.set("poi", filtrPoiEfektywny);
      if (tylkoObrysPrg) params.set("obrys", "1");
      if (tylkoOferty) params.set("oferty", "1");
      if (promienKm > 0) params.set("km", String(promienKm));
      const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(url, { scroll: false });
    };
    const t = window.setTimeout(zapisz, 400);
    return () => window.clearTimeout(t);
  }, [
    tryb,
    szukaj,
    filtrAdmin,
    filtrPoiEfektywny,
    tylkoObrysPrg,
    tylkoOferty,
    promienKm,
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

  return (
    <div className="flex flex-col gap-0 lg:mx-auto lg:max-w-[1400px] lg:flex-row lg:items-stretch lg:gap-0">
      <aside className="flex max-h-[min(48vh,420px)] shrink-0 flex-col border-b border-stone-200/80 bg-white/90 backdrop-blur-md lg:max-h-none lg:w-[min(100%,360px)] lg:border-b-0 lg:border-r lg:border-stone-200/60">
        <div className="border-b border-stone-100/90 p-4">
          <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Sposób wyboru wsi">
            <button
              type="button"
              role="tab"
              aria-selected={tryb === "katalog"}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                tryb === "katalog" ? "bg-green-800 text-white" : "border border-stone-300 bg-white text-stone-700"
              }`}
              onClick={() => ustawTryb("katalog")}
            >
              Katalog
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tryb === "szukaj"}
              className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                tryb === "szukaj" ? "bg-green-800 text-white" : "border border-stone-300 bg-white text-stone-700"
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

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-600">
            <label className="inline-flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={tylkoObrysPrg}
                onChange={(e) => ustawTylkoObrysPrg(e.target.checked)}
                className="rounded border-stone-300 text-green-800 focus:ring-green-700"
              />
              Tylko z obrysem PRG
            </label>
            <label className="inline-flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={tylkoOferty}
                onChange={(e) => ustawTylkoOferty(e.target.checked)}
                className="rounded border-stone-300 text-green-800 focus:ring-green-700"
              />
              Tylko z ofertami targu
            </label>
          </div>

          <div className="mt-2">
            <label htmlFor="mapa-filtr-poi" className="sr-only">
              Filtr kategorii punktów POI
            </label>
            <select
              id="mapa-filtr-poi"
              value={filtrPoiEfektywny}
              onChange={(e) => setFiltrPoi(e.target.value)}
              className="w-full rounded-xl border border-stone-200/90 bg-white/90 px-3 py-2 text-sm text-stone-800 shadow-sm outline-none focus:border-green-600 focus:ring-2"
            >
              <option value="wszystkie">Wszystkie punkty POI</option>
              {kategoriePoi.map((k) => (
                <option key={k} value={k}>
                  {etykietaKategoriiPoi(k)}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-2 text-xs text-stone-500">
            Wyświetlono <strong>{odfiltrowane.length}</strong> z {znaczniki.length} wsi na mapie.
            Filtry zapisują się w adresie — możesz wysłać link komuś innemu.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {pozycjaUzytkownika ? (
              <>
                <button
                  type="button"
                  onClick={() => mapRef.current?.przyblizDoUzytkownika()}
                  className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-900"
                >
                  Przybliż do mnie
                </button>
                <button
                  type="button"
                  onClick={wylaczGps}
                  className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-700"
                >
                  Wyłącz GPS
                </button>
                <select
                  value={promienKm}
                  onChange={(e) => ustawPromienKm(Number.parseInt(e.target.value, 10) || 0)}
                  className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-[11px] text-stone-700"
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
                className="rounded-lg border border-green-800/35 bg-gradient-to-br from-green-50 to-emerald-50/80 px-2.5 py-1 text-[11px] font-semibold text-green-900 disabled:opacity-60"
              >
                {statusGps === "wczytuje" ? "Pobieranie GPS…" : "📍 Moja lokalizacja"}
              </button>
            )}
            <button
              type="button"
              onClick={() => void kopiujLinkMapy()}
              className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-700"
            >
              {kopiujLink === "ok" ? "Skopiowano!" : kopiujLink === "blad" ? "Błąd kopiowania" : "Kopiuj link"}
            </button>
            {(filtrAdmin.wojSlug || szukaj.trim() || tylkoObrysPrg || tylkoOferty || promienKm > 0) && (
              <button
                type="button"
                onClick={wyczyscFiltry}
                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-950"
              >
                Wyczyść filtry
              </button>
            )}
            {statusGps === "blad" ? (
              <span className="text-[11px] text-amber-800">Brak zgody na lokalizację.</span>
            ) : null}
          </div>
        </div>

        <ul key={kluczListy} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3">
          {wierszeListy.length === 0 ? (
            <li className="p-4 text-sm text-amber-900">
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
            wierszeListy.map((z, index) => (
              <li key={z.id}>
                <div
                  className="flex gap-1 rounded-lg py-1 pl-1 pr-0 opacity-0 animate-mapa-row hover:bg-green-50/90 motion-reduce:animate-none motion-reduce:opacity-100"
                  style={{ animationDelay: `${Math.min(index, 18) * 38}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => naMapie(z.id)}
                    className="shrink-0 self-center rounded-lg border border-green-800/30 bg-gradient-to-b from-green-50 to-emerald-50/90 px-2 py-1.5 text-[11px] font-semibold text-green-900"
                    title="Przybliż mapę i otwórz opis wsi"
                  >
                    Na mapie
                  </button>
                  <Link
                    href={z.sciezka}
                    className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg px-2 py-2 text-sm transition-colors hover:text-green-950"
                  >
                    <span className="font-medium text-stone-900">
                      {podswietlDopasowanie(z.name, frazaDoPodswietlenia)}
                    </span>
                    <span className="text-xs text-stone-500">
                      {frazaDoPodswietlenia
                        ? podswietlDopasowanie(
                            [z.commune, z.county, z.voivodeship].filter(Boolean).join(" · ") || "—",
                            frazaDoPodswietlenia,
                          )
                        : [z.commune, z.county, z.voivodeship].filter(Boolean).join(" · ") || "—"}
                      {pozycjaUzytkownika ? (
                        <>
                          {" · "}
                          {Math.round(odlegloscKm(pozycjaUzytkownika.lat, pozycjaUzytkownika.lon, z.lat, z.lon))} km
                        </>
                      ) : null}
                      {" · "}
                      {z.public_offers_count > 0
                        ? `${z.public_offers_count} ofert · `
                        : "brak ofert · "}
                      {z.boundary_geojson ? "obrys PRG" : "obrys szacunkowy"}
                    </span>
                  </Link>
                </div>
              </li>
            ))
          )}
        </ul>
      </aside>

      <div className="min-h-[min(72dvh,560px)] flex-1 bg-gradient-to-br from-stone-100/80 via-emerald-50/20 to-stone-100/90 p-3 md:p-4">
        {odfiltrowane.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            Brak wsi do pokazania na mapie — zmień filtry w panelu po lewej.
          </p>
        ) : (
          <MapaWsiLeaflet
            ref={mapRef}
            znaczniki={wierszeListy}
            punktyPoi={punktyPoiFiltrowane}
            punktyRynek={punktyRynek}
            pozycjaUzytkownika={pozycjaUzytkownika}
            promienKm={promienKm > 0 ? promienKm : null}
          />
        )}
      </div>
    </div>
  );
}
