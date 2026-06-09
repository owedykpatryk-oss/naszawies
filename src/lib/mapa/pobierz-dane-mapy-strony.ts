import type { ZnacznikAdres, ZnacznikGeoKontekst, ZnacznikZgloszenie } from "@/components/mapa/mapa-wsi-leaflet";
import type { StatystykiMapy } from "@/components/mapa/mapa-statystyki-banner";
import { pobierzKolaLowieckieNaMape } from "@/lib/mapa/pobierz-kola-lowieckie-na-mape";
import { pobierzRewiryNaMape } from "@/lib/mapa/pobierz-rewiry-na-mape";
import { przygotujPoiLowieckieNaMape } from "@/lib/mapa/poi-lowieckie-widocznosc";
import { pobierzOstrzezeniaLesneNaMape } from "@/lib/lesnictwo/pobierz-ostrzezenia-na-mape";
import { pobierzPolowaniaNaMape } from "@/lib/mapa/pobierz-polowania-na-mape";
import {
  pobierzPubliczneDaneMapy,
  type PubliczneDaneMapy,
  type ZakresMapy,
} from "@/lib/mapa/pobierz-publiczne-dane-mapy";
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

export type OpcjeDaneMapyStrony = {
  zakres?: ZakresMapy;
  faza?: "rdzen" | "pelne";
};

function budujStatystyki(
  publiczne: PubliczneDaneMapy,
  punktyPoi: PubliczneDaneMapy["punktyPoi"],
): { statystykiMapy: StatystykiMapy; villageIdsDoUzupelnienia: string[] } {
  const { znaczniki } = publiczne;
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

  return { statystykiMapy, villageIdsDoUzupelnienia };
}

async function pobierzWarstwyUzytkownika(
  user: User | null,
  znaczniki: PubliczneDaneMapy["znaczniki"],
  wioskiCzlonkow: Set<string>,
): Promise<{
  punktyAdresy: ZnacznikAdres[];
  punktyGeoKontekst: ZnacznikGeoKontekst[];
  punktyZgloszenia: ZnacznikZgloszenie[];
}> {
  const puste = {
    punktyAdresy: [] as ZnacznikAdres[],
    punktyGeoKontekst: [] as ZnacznikGeoKontekst[],
    punktyZgloszenia: [] as ZnacznikZgloszenie[],
  };

  if (!user || znaczniki.length === 0) return puste;

  try {
    const sbAuth = utworzKlientaSupabaseSerwer();
    const { data: roleRows } = await sbAuth
      .from("user_village_roles")
      .select("village_id")
      .eq("user_id", user.id)
      .eq("status", "active");
    const vids = Array.from(new Set((roleRows ?? []).map((r) => r.village_id)));
    vids.forEach((id) => wioskiCzlonkow.add(id));

    const wiesPoIdMapy = new Map<string, { name: string; sciezka: string }>();
    for (const z of znaczniki) {
      if (vids.includes(z.id)) {
        wiesPoIdMapy.set(z.id, { name: z.name, sciezka: z.sciezka });
      }
    }

    let punktyAdresy: ZnacznikAdres[] = [];
    let punktyGeoKontekst: ZnacznikGeoKontekst[] = [];
    if (wiesPoIdMapy.size > 0) {
      const warstwyGeo = await pobierzWarstwyGeoportalNaMape(sbAuth, wiesPoIdMapy);
      punktyAdresy = warstwyGeo.punktyAdresy;
      punktyGeoKontekst = warstwyGeo.punktyGeoKontekst;
    }

    const punktyZgloszenia: ZnacznikZgloszenie[] = [];
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

    return { punktyAdresy, punktyGeoKontekst, punktyZgloszenia };
  } catch {
    return puste;
  }
}

export async function pobierzDaneMapyStrony(
  user: User | null,
  opts: OpcjeDaneMapyStrony = {},
): Promise<DaneMapyStrony> {
  const zakres = opts.zakres ?? "nakielski";
  const tylkoRdzen = opts.faza === "rdzen";

  const publiczne = await pobierzPubliczneDaneMapy({
    zakres,
    tylkoZnaczniki: tylkoRdzen,
  });

  const wioskiCzlonkow = new Set<string>();
  const pusteWarstwy = {
    punktyPolowania: [] as Awaited<ReturnType<typeof pobierzPolowaniaNaMape>>,
    ostrzezeniaLesne: [] as Awaited<ReturnType<typeof pobierzOstrzezeniaLesneNaMape>>,
    punktyKola: [] as Awaited<ReturnType<typeof pobierzKolaLowieckieNaMape>>,
    rewiryLowieckie: [] as Awaited<ReturnType<typeof pobierzRewiryNaMape>>,
    punktyAdresy: [] as ZnacznikAdres[],
    punktyGeoKontekst: [] as ZnacznikGeoKontekst[],
    punktyZgloszenia: [] as ZnacznikZgloszenie[],
  };

  if (tylkoRdzen) {
    const { statystykiMapy, villageIdsDoUzupelnienia } = budujStatystyki(publiczne, []);
    return {
      ...publiczne,
      ...pusteWarstwy,
      statystykiMapy,
      villageIdsDoUzupelnienia,
      znacznikiDoSync: publiczne.znaczniki.map((z) => ({
        id: z.id,
        boundary_geojson: z.boundary_geojson,
        has_boundary: z.has_boundary,
      })),
    };
  }

  const { znaczniki, punktyPoi: punktyPoiSurowe } = publiczne;

  const [punktyPolowania, ostrzezeniaLesne, punktyKola, rewiryLowieckie, warstwyUser] =
    await Promise.all([
      pobierzPolowaniaNaMape(znaczniki),
      pobierzOstrzezeniaLesneNaMape(znaczniki),
      pobierzKolaLowieckieNaMape(znaczniki),
      pobierzRewiryNaMape(znaczniki),
      pobierzWarstwyUzytkownika(user, znaczniki, wioskiCzlonkow),
    ]);

  const punktyPoi = przygotujPoiLowieckieNaMape(punktyPoiSurowe, wioskiCzlonkow);
  const { statystykiMapy, villageIdsDoUzupelnienia } = budujStatystyki(
    { ...publiczne, punktyPoi },
    punktyPoi,
  );

  return {
    ...publiczne,
    punktyPoi,
    punktyPolowania,
    ostrzezeniaLesne,
    punktyKola,
    rewiryLowieckie,
    ...warstwyUser,
    statystykiMapy,
    villageIdsDoUzupelnienia,
    znacznikiDoSync: znaczniki.map((z) => ({
      id: z.id,
      boundary_geojson: z.boundary_geojson,
      has_boundary: z.has_boundary,
    })),
  };
}
