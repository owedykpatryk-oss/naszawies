import type { ZnacznikAdres, ZnacznikGeoKontekst, ZnacznikZgloszenie } from "@/components/mapa/mapa-wsi-leaflet";
import type { StatystykiMapy } from "@/components/mapa/mapa-statystyki-banner";
import { pobierzKolaLowieckieNaMape } from "@/lib/mapa/pobierz-kola-lowieckie-na-mape";
import { pobierzRewiryNaMape } from "@/lib/mapa/pobierz-rewiry-na-mape";
import { przygotujPoiLowieckieNaMape } from "@/lib/mapa/poi-lowieckie-widocznosc";
import { pobierzOstrzezeniaLesneNaMape } from "@/lib/lesnictwo/pobierz-ostrzezenia-na-mape";
import { pobierzPolowaniaNaMape } from "@/lib/mapa/pobierz-polowania-na-mape";
import { pobierzPubliczneDaneMapy, type PubliczneDaneMapy } from "@/lib/mapa/pobierz-publiczne-dane-mapy";
import { pobierzWarstwyGeoportalNaMape } from "@/lib/mapa/pobierz-warstwy-geoportal-na-mape";
import {
  obliczStatystykiMapy,
  obliczSredniaKompletnoscMapy,
  polaczIdWsiDoUzupelnienia,
  wybierzWsiBezTransportuNaMapie,
  wybierzWsiZMalymPoi,
} from "@/lib/mapa/wybierz-wsi-do-uzupelnienia";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import type { User } from "@supabase/supabase-js";

function doLiczby(v: string | number | null | undefined): number {
  if (v == null) return NaN;
  return typeof v === "number" ? v : Number.parseFloat(String(v));
}

export type DaneMapyStrony = PubliczneDaneMapy & {
  punktyPolowania: Awaited<ReturnType<typeof pobierzPolowaniaNaMape>>;
  ostrzezeniaLesne: Awaited<ReturnType<typeof pobierzOstrzezeniaLesneNaMape>>;
  punktyKola: Awaited<ReturnType<typeof pobierzKolaLowieckieNaMape>>;
  rewiryLowieckie: Awaited<ReturnType<typeof pobierzRewiryNaMape>>;
  punktyAdresy: ZnacznikAdres[];
  punktyGeoKontekst: ZnacznikGeoKontekst[];
  punktyZgloszenia: ZnacznikZgloszenie[];
  statystykiMapy: StatystykiMapy;
  villageIdsDoUzupelnienia: string[];
  znacznikiDoSync: { id: string; boundary_geojson: unknown | null; has_boundary?: boolean }[];
};

export async function pobierzDaneMapyStrony(user: User | null): Promise<DaneMapyStrony> {
  const publiczne = await pobierzPubliczneDaneMapy();
  const { znaczniki, punktyPoi: punktyPoiSurowe } = publiczne;

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

  if (znaczniki.length > 0 && user) {
    try {
      const sbAuth = utworzKlientaSupabaseSerwer();
      const wiesPoIdMapy = new Map(
        znaczniki.map((z) => [z.id, { name: z.name, sciezka: z.sciezka } as const]),
      );
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
    } catch {
      /* warstwy opcjonalne */
    }
  }

  const punktyPoi = przygotujPoiLowieckieNaMape(punktyPoiSurowe, wioskiCzlonkow);

  const { srednia: sredniaKompletnosc } = obliczSredniaKompletnoscMapy(
    znaczniki.map((z) => ({
      id: z.id,
      name: z.name,
      boundary_geojson: z.boundary_geojson,
      has_boundary: z.has_boundary,
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

  return {
    ...publiczne,
    punktyPoi,
    punktyPolowania,
    ostrzezeniaLesne,
    punktyKola,
    rewiryLowieckie,
    punktyAdresy,
    punktyGeoKontekst,
    punktyZgloszenia,
    statystykiMapy,
    villageIdsDoUzupelnienia,
    znacznikiDoSync: znaczniki.map((z) => ({
      id: z.id,
      boundary_geojson: z.boundary_geojson,
      has_boundary: z.has_boundary,
    })),
  };
}
