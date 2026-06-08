import type { Metadata } from "next";
import { Suspense } from "react";
import { BramkiChronionychTras } from "@/components/panel/bramki-chronionych-tras";
import { MapaAutomatyzacjaKlient } from "@/components/mapa/mapa-automatyzacja-klient";
import { MapaStatystykiBanner } from "@/components/mapa/mapa-statystyki-banner";
import { LinkPomocyKontekstowej } from "@/components/pomoc/link-pomocy-kontekstowej";
import { MapaWsiStronaDynamic, MapaWsiStronaSkeleton } from "@/components/mapa/mapa-wsi-strona-dynamic";
import type { StatystykiMapy } from "@/components/mapa/mapa-statystyki-banner";
import {
  obliczStatystykiMapy,
  obliczSredniaKompletnoscMapy,
  polaczIdWsiDoUzupelnienia,
  wybierzWsiBezTransportuNaMapie,
  wybierzWsiZMalymPoi,
} from "@/lib/mapa/wybierz-wsi-do-uzupelnienia";
import type { ZnacznikAdres, ZnacznikGeoKontekst, ZnacznikZgloszenie } from "@/components/mapa/mapa-wsi-leaflet";
import { pobierzKolaLowieckieNaMape } from "@/lib/mapa/pobierz-kola-lowieckie-na-mape";
import { pobierzRewiryNaMape } from "@/lib/mapa/pobierz-rewiry-na-mape";
import { przygotujPoiLowieckieNaMape } from "@/lib/mapa/poi-lowieckie-widocznosc";
import { pobierzOstrzezeniaLesneNaMape } from "@/lib/lesnictwo/pobierz-ostrzezenia-na-mape";
import { pobierzPolowaniaNaMape } from "@/lib/mapa/pobierz-polowania-na-mape";
import { pobierzPubliczneDaneMapy } from "@/lib/mapa/pobierz-publiczne-dane-mapy";
import { pobierzWarstwyGeoportalNaMape } from "@/lib/mapa/pobierz-warstwy-geoportal-na-mape";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";

export const metadata: Metadata = {
  title: "Mapa wsi",
  description:
    "Mapa katalogu wsi po zalogowaniu: granice sołectwa, punkty POI, łowiectwo, polowania i transport — gdy sołectwo doda dane w serwisie.",
  robots: { index: false, follow: false },
};

function etykietaLiczbyWsi(n: number): string {
  if (n === 1) return "1 wieś na mapie";
  const o = n % 10;
  const oo = n % 100;
  if (o >= 2 && o <= 4 && (oo < 12 || oo > 14)) return `${n} wsie na mapie`;
  return `${n} wiosek na mapie`;
}

function doLiczby(v: string | number | null | undefined): number {
  if (v == null) return NaN;
  return typeof v === "number" ? v : Number.parseFloat(String(v));
}

export default async function MapaPage() {
  const user = await pobierzUzytkownikaSerwer();

  const { znaczniki, punktyPoi: punktyPoiSurowe, punktyRynek, punktyRynekDzialki, obrysyCmentarzy, bladZapytania } =
    await pobierzPubliczneDaneMapy();

  const [punktyPolowania, ostrzezeniaLesne, punktyKola, rewiryLowieckie] = await Promise.all([
    pobierzPolowaniaNaMape(znaczniki),
    pobierzOstrzezeniaLesneNaMape(znaczniki),
    pobierzKolaLowieckieNaMape(znaczniki),
    pobierzRewiryNaMape(znaczniki),
  ]);

  let punktyAdresy: ZnacznikAdres[] = [];
  let punktyGeoKontekst: ZnacznikGeoKontekst[] = [];
  const punktyZgloszenia: ZnacznikZgloszenie[] = [];
  const wioskiCzlonkow = new Set<string>();

  const wiesPoIdMapy = new Map(
    znaczniki.map((z) => [z.id, { name: z.name, sciezka: z.sciezka } as const]),
  );

  try {
    if (znaczniki.length > 0 && user) {
      const sbAuth = utworzKlientaSupabaseSerwer();
      const warstwyGeo = await pobierzWarstwyGeoportalNaMape(sbAuth, wiesPoIdMapy);
      punktyAdresy = warstwyGeo.punktyAdresy;
      punktyGeoKontekst = warstwyGeo.punktyGeoKontekst;
      const { data: roleRows } = await sbAuth
        .from("user_village_roles")
        .select("village_id")
        .eq("user_id", user.id)
        .eq("status", "active");
      const vids = Array.from(new Set((roleRows ?? []).map((r) => r.village_id)));
      vids.forEach((id) => wioskiCzlonkow.add(id));
      if (vids.length > 0) {
        const wiesPoId = new Map(znaczniki.map((z) => [z.id, z.name]));
        const { data: issues } = await sbAuth
          .from("issues")
          .select("id, title, status, category, latitude, longitude, village_id")
          .in("village_id", vids)
          .in("status", ["nowe", "w_trakcie"])
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .limit(150);
        for (const iss of issues ?? []) {
          const lat = doLiczby(iss.latitude as string | number | null);
          const lon = doLiczby(iss.longitude as string | number | null);
          if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
          punktyZgloszenia.push({
            id: iss.id,
            title: iss.title,
            status: iss.status,
            category: typeof iss.category === "string" ? iss.category : undefined,
            lat,
            lon,
            villageName: wiesPoId.get(iss.village_id) ?? "Wieś",
            villageId: iss.village_id,
          });
        }
      }
    }
  } catch {
    /* warstwy opcjonalne */
  }

  const punktyPoi = przygotujPoiLowieckieNaMape(punktyPoiSurowe, wioskiCzlonkow);

  const liczbaWsi = znaczniki.length;
  const { srednia: sredniaKompletnosc } = obliczSredniaKompletnoscMapy(
    znaczniki.map((z) => ({
      id: z.id,
      name: z.name,
      boundary_geojson: z.boundary_geojson,
      latitude: z.lat,
      longitude: z.lon,
    })),
    punktyPoi,
  );
  const statystykiMapy: StatystykiMapy = {
    ...obliczStatystykiMapy(znaczniki, punktyPoi),
    sredniaKompletnosc,
  };
  const villageIdsDoUzupelnienia = polaczIdWsiDoUzupelnienia(
    wybierzWsiBezTransportuNaMapie(znaczniki, punktyPoi, 8),
    wybierzWsiZMalymPoi(znaczniki, punktyPoi, 8),
  ).slice(0, 10);

  const znacznikiDoSync = znaczniki.map((z) => ({
    id: z.id,
    boundary_geojson: z.boundary_geojson,
  }));

  return (
    <>
      <BramkiChronionychTras />
    <main className="mapa-strona-glowna mapa-strona-glowna--immersive flex min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-green-900/8 bg-gradient-to-r from-white via-emerald-50/30 to-white px-3 py-2 backdrop-blur-sm sm:px-4">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="font-serif text-base font-medium leading-tight text-green-950 sm:text-lg">Mapa wiosek</h1>
          <LinkPomocyKontekstowej
            href="/pomoc#mapa"
            label="Pomoc: mapa wsi"
            tytul="Katalog administracyjny, warstwy POI, GPS, filtry w adresie URL"
          />
          {!bladZapytania && liczbaWsi > 0 ? (
            <span className="rounded-full border border-green-900/10 bg-green-50/90 px-2.5 py-0.5 text-[11px] font-medium text-green-900">
              {etykietaLiczbyWsi(liczbaWsi)}
            </span>
          ) : null}
        </div>
      </header>

      {bladZapytania ? (
        <p
          className={`mx-3 mt-3 rounded-xl px-4 py-3 text-sm sm:mx-4 ${znaczniki.length > 0 ? "border border-amber-200 bg-amber-50 text-amber-950" : "bg-red-50 text-red-800"}`}
          role="alert"
        >
          {bladZapytania}
        </p>
      ) : null}

      {!bladZapytania && znaczniki.length === 0 ? (
        <p className="mx-3 mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 sm:mx-4">
          Brak aktywnych wsi z uzupełnionymi współrzędnymi. Po dodaniu wsi w bazie mapa się wypełni.
        </p>
      ) : null}

      {!bladZapytania && znaczniki.length > 0 ? (
        <div className="mapa-widget-pelny flex min-h-0 flex-1 flex-col">
          <MapaStatystykiBanner statystyki={statystykiMapy} />
          <Suspense fallback={<MapaWsiStronaSkeleton />}>
            <MapaAutomatyzacjaKlient
              znaczniki={znacznikiDoSync}
              villageIdsDoUzupelnienia={villageIdsDoUzupelnienia}
              statystyki={statystykiMapy}
            />
            <MapaWsiStronaDynamic
              znaczniki={znaczniki}
              punktyPoi={punktyPoi}
              punktyAdresy={punktyAdresy}
              punktyRynek={punktyRynek}
              punktyRynekDzialki={punktyRynekDzialki}
              punktyZgloszenia={punktyZgloszenia}
              punktyPolowania={punktyPolowania}
              ostrzezeniaLesne={ostrzezeniaLesne}
              punktyKola={punktyKola}
              rewiryLowieckie={rewiryLowieckie}
              punktyCmentarze={obrysyCmentarzy}
              punktyGeoKontekst={punktyGeoKontekst}
            />
          </Suspense>
        </div>
      ) : null}
    </main>
    </>
  );
}
