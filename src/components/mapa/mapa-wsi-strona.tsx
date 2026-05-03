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
  MapaWsiLeaflet,
  type MapaWsiLeafletRef,
  type ZnacznikPoi,
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

/** Podświetla pierwsze dopasowanie frazy (bez normalizacji spacji — jak wpis użytkownika). */
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

export function MapaWsiStrona({
  znaczniki,
  punktyPoi = [],
}: {
  znaczniki: ZnacznikWsi[];
  /** Punkty z tabeli `pois` (kościół, szkoła, świetlica…) — dla wsi z listy. */
  punktyPoi?: ZnacznikPoi[];
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const mapRef = useRef<MapaWsiLeafletRef>(null);

  const [szukaj, setSzukaj] = useState(() => searchParams.get("q") ?? "");
  const [filtrPoi, setFiltrPoi] = useState(() => searchParams.get("poi") ?? "wszystkie");
  const szukajOdroczone = useDeferredValue(szukaj);
  const [pozycjaUzytkownika, setPozycjaUzytkownika] = useState<{ lat: number; lon: number } | null>(
    null,
  );
  const [statusGps, setStatusGps] = useState<"idle" | "wczytuje" | "blad" | "ok">("idle");

  const odfiltrowane = useMemo(() => {
    const q = normalizuj(szukajOdroczone);
    if (!q) return znaczniki;
    const qBezSpacji = q.replace(/\s/g, "");
    return znaczniki.filter((z) => {
      if (polePasuje(z.name, q)) return true;
      if (polePasuje(z.commune, q)) return true;
      if (polePasuje(z.county, q)) return true;
      if (polePasuje(z.voivodeship, q)) return true;
      if (polePasuje(z.teryt_id, q)) return true;
      if (z.sciezka.toLowerCase().replace(/\s/g, "").includes(qBezSpacji)) return true;
      return false;
    });
  }, [znaczniki, szukajOdroczone]);

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

  const frazaDoPodswietlenia = szukajOdroczone.trim();

  useEffect(() => {
    const zapisz = () => {
      const q = szukaj.trim();
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (filtrPoiEfektywny !== "wszystkie") params.set("poi", filtrPoiEfektywny);
      const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(url, { scroll: false });
    };
    const t = window.setTimeout(zapisz, 400);
    return () => window.clearTimeout(t);
  }, [szukaj, filtrPoiEfektywny, pathname, router]);

  const wyczysc = useCallback(() => {
    setSzukaj("");
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const naMapie = useCallback((id: string) => {
    mapRef.current?.pokazNaMapie(id);
  }, []);

  const wlaczSortowaniePoGps = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatusGps("blad");
      return;
    }
    setStatusGps("wczytuje");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPozycjaUzytkownika({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setStatusGps("ok");
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
  }, []);

  const kluczListy = `${frazaDoPodswietlenia}|${pozycjaUzytkownika ? "gps" : "nogps"}`;

  return (
    <div className="flex flex-col gap-0 lg:mx-auto lg:max-w-[1400px] lg:flex-row lg:items-stretch lg:gap-0">
      <aside className="flex max-h-[min(42vh,380px)] shrink-0 flex-col border-b border-stone-200/80 bg-white/90 backdrop-blur-md lg:max-h-none lg:w-[min(100%,340px)] lg:border-b-0 lg:border-r lg:border-stone-200/60">
        <div className="border-b border-stone-100/90 p-4">
          <label htmlFor="mapa-szukaj" className="sr-only">
            Szukaj wsi po nazwie lub miejscu
          </label>
          <div className="flex gap-2">
            <input
              id="mapa-szukaj"
              type="search"
              value={szukaj}
              onChange={(e) => setSzukaj(e.target.value)}
              placeholder="Nazwa wsi, gmina, powiat, województwo…"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl border border-stone-200/90 bg-white/90 px-3 py-2.5 text-sm text-stone-900 shadow-sm outline-none ring-green-800/20 transition-all duration-300 placeholder:text-stone-400 focus:border-green-600 focus:shadow-md focus:ring-2 focus:ring-green-700/25"
            />
            {szukaj.trim() ? (
              <button
                type="button"
                onClick={wyczysc}
                className="shrink-0 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 hover:shadow active:scale-[0.98]"
              >
                Wyczyść
              </button>
            ) : null}
          </div>
          <div className="mt-2">
            <label htmlFor="mapa-filtr-poi" className="sr-only">
              Filtr kategorii punktów POI
            </label>
            <select
              id="mapa-filtr-poi"
              value={filtrPoiEfektywny}
              onChange={(e) => setFiltrPoi(e.target.value)}
              className="w-full rounded-xl border border-stone-200/90 bg-white/90 px-3 py-2 text-sm text-stone-800 shadow-sm outline-none ring-green-800/20 transition focus:border-green-600 focus:ring-2 focus:ring-green-700/25"
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
            Wpisana fraza wybiera wsi z listy (nazwa, gmina, powiat, województwo, fragment adresu strony). Wyszukiwanie
            widać też w adresie strony, żeby można było wysłać komuś link.
          </p>
          {filtrPoiEfektywny !== "wszystkie" && punktyPoiFiltrowane.length === 0 ? (
            <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[11px] text-amber-900">
              Brak punktów w tej kategorii dla aktualnie widocznych wsi. Granice i wsie są nadal pokazane na mapie.
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {pozycjaUzytkownika ? (
              <button
                type="button"
                onClick={wylaczGps}
                className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-700 shadow-sm transition hover:bg-stone-50 hover:shadow active:scale-[0.98]"
              >
                Wyłącz sortowanie po lokalizacji
              </button>
            ) : (
              <button
                type="button"
                onClick={wlaczSortowaniePoGps}
                disabled={statusGps === "wczytuje"}
                className="rounded-lg border border-green-800/35 bg-gradient-to-br from-green-50 to-emerald-50/80 px-2.5 py-1 text-[11px] font-semibold text-green-900 shadow-sm transition hover:border-green-800/50 hover:shadow-md disabled:opacity-60 disabled:active:scale-100 active:scale-[0.98]"
              >
                {statusGps === "wczytuje" ? "Pobieranie lokalizacji…" : "Sortuj: najbliżej mnie"}
              </button>
            )}
            {statusGps === "blad" ? (
              <span className="text-[11px] text-amber-800">Brak zgody lub niedostępna lokalizacja.</span>
            ) : null}
            {statusGps === "ok" && pozycjaUzytkownika ? (
              <span className="text-[11px] text-stone-500">Lista wg odległości (linia prosta).</span>
            ) : null}
          </div>
        </div>
        <ul key={kluczListy} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3">
          {wierszeListy.map((z, index) => (
            <li key={z.id}>
              <div
                className="flex gap-1 rounded-lg py-1 pl-1 pr-0 opacity-0 animate-mapa-row hover:bg-green-50/90 hover:shadow-sm motion-reduce:animate-none motion-reduce:opacity-100"
                style={{ animationDelay: `${Math.min(index, 18) * 38}ms` }}
              >
                <button
                  type="button"
                  onClick={() => naMapie(z.id)}
                  className="shrink-0 self-center rounded-lg border border-green-800/30 bg-gradient-to-b from-green-50 to-emerald-50/90 px-2 py-1.5 text-[11px] font-semibold text-green-900 shadow-sm transition hover:border-green-800/45 hover:shadow active:scale-[0.97]"
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
                      ? `${z.public_offers_count} ofert targu · `
                      : "brak ofert targu · "}
                    {z.boundary_geojson ? "granica (GeoJSON)" : "obrys przybliżony"}
                  </span>
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </aside>
      <div className="min-h-[min(72dvh,560px)] flex-1 bg-gradient-to-br from-stone-100/80 via-emerald-50/20 to-stone-100/90 p-3 md:p-4">
        {odfiltrowane.length === 0 ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            Brak wsi pasujących do wyszukiwania. Wyczyść pole albo spróbuj dłuższej wyszukiwarki na stronie{" "}
            <Link href="/szukaj" className="font-semibold text-green-900 underline">
              Szukaj wsi
            </Link>
            .
          </p>
        ) : (
          <MapaWsiLeaflet ref={mapRef} znaczniki={wierszeListy} punktyPoi={punktyPoiFiltrowane} />
        )}
      </div>
    </div>
  );
}
