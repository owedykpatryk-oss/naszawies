import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MapaAutomatyzacjaKlient } from "@/components/mapa/mapa-automatyzacja-klient";
import type { StatystykiMapy } from "@/components/mapa/mapa-statystyki-banner";
import {
  obliczStatystykiMapy,
  wybierzWsiBezTransportuNaMapie,
} from "@/lib/mapa/wybierz-wsi-do-uzupelnienia";
import { MapaWsiStronaDynamic } from "@/components/mapa/mapa-wsi-strona-dynamic";
import type {
  ZnacznikAdres,
  ZnacznikPoi,
  ZnacznikPolowanie,
  ZnacznikRynek,
  ZnacznikWsi,
  ZnacznikZgloszenie,
} from "@/components/mapa/mapa-wsi-leaflet";
import { centroidObszaruPolowania } from "@/lib/lowiectwo/geojson-obszar";
import { mapujOgloszeniaRynekDlaMapy } from "@/lib/mapa/rynek-na-mapie";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

export const metadata: Metadata = {
  title: "Mapa wsi",
  description:
    "Mapa wsi: granice sołectwa, punkt wsi oraz miejsca w miejscowości (m.in. OSP i punkt czerpania wody, kościół, szkoła, świetlica, stacja kolejowa) — gdy sołectwo doda dane w serwisie.",
};

type WierszRpc = {
  id: string;
  name: string;
  slug: string;
  voivodeship: string;
  county: string;
  commune: string;
  teryt_id: string;
  latitude: string | number | null;
  longitude: string | number | null;
  population: number | null;
  boundary_geojson: unknown | null;
  public_offers_count: number | string | null;
};

function doLiczby(v: string | number | null | undefined): number {
  if (v == null) return NaN;
  return typeof v === "number" ? v : Number.parseFloat(String(v));
}

function doLiczbyCalkowitej(v: number | string | null | undefined): number {
  if (v == null) return 0;
  return typeof v === "number" ? Math.trunc(v) : Number.parseInt(String(v), 10) || 0;
}

function etykietaLiczbyWsi(n: number): string {
  if (n === 1) return "1 wieś na mapie";
  const o = n % 10;
  const oo = n % 100;
  if (o >= 2 && o <= 4 && (oo < 12 || oo > 14)) return `${n} wsie na mapie`;
  return `${n} wiosek na mapie`;
}

type WierszPoi = {
  id: string;
  village_id: string;
  category: string;
  name: string;
  description: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  source: string | null;
  confidence: number | string | null;
  verified_at: string | null;
  is_local_override: boolean | null;
  osp_water_source_type: string | null;
  osp_water_capacity_lpm: number | null;
  osp_winter_access: boolean | null;
  osp_heavy_truck_access: boolean | null;
  osp_note: string | null;
  photo_url: string | null;
  photo_caption: string | null;
};

const KATEGORIE_WYMAGAJACE_WERYFIKACJI = new Set(["szkola", "kosciol"]);

function czyPoiPubliczny(r: WierszPoi): boolean {
  const kat = r.category.trim().toLowerCase();
  if (!KATEGORIE_WYMAGAJACE_WERYFIKACJI.has(kat)) return true;
  if (r.is_local_override === true) return true;
  if (
    r.source === "manual" ||
    r.source === "local_corrected" ||
    r.source === "osm_manual" ||
    r.source === "osm_auto"
  )
    return true;
  if (r.verified_at) return true;
  const confidence = r.confidence != null ? Number(r.confidence) : 0;
  return Number.isFinite(confidence) && confidence >= 0.8;
}

function mapujPoiDlaMapy(
  wiersze: WierszPoi[] | null,
  wiesPoId: Map<string, { name: string; sciezka: string }>,
): ZnacznikPoi[] {
  if (!wiersze?.length) return [];
  const out: ZnacznikPoi[] = [];
  for (const r of wiersze) {
    if (!czyPoiPubliczny(r)) continue;
    const w = wiesPoId.get(r.village_id);
    if (!w) continue;
    const lat = doLiczby(r.latitude);
    const lon = doLiczby(r.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
    out.push({
      id: r.id,
      villageId: r.village_id,
      villageName: w.name,
      sciezkaWsi: w.sciezka,
      category: r.category,
      name: r.name,
      description: r.description,
      lat,
      lon,
      ospWaterSourceType: r.osp_water_source_type,
      ospWaterCapacityLpm: r.osp_water_capacity_lpm,
      ospWinterAccess: r.osp_winter_access,
      ospHeavyTruckAccess: r.osp_heavy_truck_access,
      ospNote: r.osp_note,
      photoUrl: r.photo_url,
      photoCaption: r.photo_caption,
    });
  }
  return out;
}

export default async function MapaPage() {
  const supabase = createPublicSupabaseClient();
  let znaczniki: ZnacznikWsi[] = [];
  let bladZapytania: string | null = null;

  if (!supabase) {
    bladZapytania = "Mapa jest chwilowo niedostępna. Spróbuj ponownie później.";
  } else {
    const { data, error } = await supabase.rpc("mapa_wsi_znaczniki");

    if (!error && data && Array.isArray(data)) {
      znaczniki = (data as WierszRpc[]).flatMap((w) => {
        const lat = doLiczby(w.latitude);
        const lon = doLiczby(w.longitude);
        if (Number.isNaN(lat) || Number.isNaN(lon)) return [];
        const z: ZnacznikWsi = {
          id: w.id,
          name: w.name,
          sciezka: sciezkaProfiluWsi({
            voivodeship: w.voivodeship,
            county: w.county,
            commune: w.commune,
            slug: w.slug,
          }),
          lat,
          lon,
          population: w.population,
          boundary_geojson: w.boundary_geojson,
          public_offers_count: doLiczbyCalkowitej(w.public_offers_count),
          commune: w.commune,
          county: w.county,
          voivodeship: w.voivodeship,
          teryt_id: w.teryt_id,
        };
        return [z];
      });
    } else {
      const opisRpc = error?.message ?? "Nie udało się wczytać mapy.";
      const { data: wiersze, error: err2 } = await supabase
        .from("villages")
        .select("id, name, slug, voivodeship, county, commune, teryt_id, latitude, longitude, population, boundary_geojson")
        .eq("is_active", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("name", { ascending: true })
        .limit(5000);

      if (err2) {
        bladZapytania = `${opisRpc} · ${err2.message}`;
      } else {
        znaczniki = (wiersze ?? []).map((w) => {
          const lat = doLiczby(w.latitude as string | number | null);
          const lon = doLiczby(w.longitude as string | number | null);
          return {
            id: w.id,
            name: w.name,
            sciezka: sciezkaProfiluWsi({
              voivodeship: w.voivodeship,
              county: w.county,
              commune: w.commune,
              slug: w.slug,
            }),
            lat,
            lon,
            population: (w as { population?: number | null }).population ?? null,
            boundary_geojson: (w as { boundary_geojson?: unknown | null }).boundary_geojson ?? null,
            public_offers_count: 0,
            commune: w.commune,
            county: w.county,
            voivodeship: w.voivodeship,
            teryt_id: (w as { teryt_id?: string }).teryt_id,
          };
        });
        bladZapytania = error ? `${opisRpc} · Wyświetlono listę wsi w trybie ograniczonym (np. bez liczników ofert).` : null;
      }
    }
  }

  let punktyPoi: ZnacznikPoi[] = [];
  let punktyRynek: ZnacznikRynek[] = [];
  const punktyAdresy: ZnacznikAdres[] = [];
  if (supabase && znaczniki.length > 0) {
    const wiesPoId = new Map(znaczniki.map((z) => [z.id, { name: z.name, sciezka: z.sciezka } as const]));
    const idsWsi = znaczniki.map((z) => z.id);
    const { data: wierszePoi, error: errPoi } = await supabase
      .from("pois")
      .select(
        "id, village_id, category, name, description, latitude, longitude, source, confidence, verified_at, is_local_override, osp_water_source_type, osp_water_capacity_lpm, osp_winter_access, osp_heavy_truck_access, osp_note, photo_url, photo_caption",
      )
      .in("village_id", idsWsi);
    if (!errPoi && wierszePoi) {
      punktyPoi = mapujPoiDlaMapy(wierszePoi as WierszPoi[], wiesPoId);
    }
    const { data: wierszeRynek } = await supabase
      .from("marketplace_listings")
      .select("id, title, listing_type, latitude, longitude, village_id")
      .in("village_id", idsWsi)
      .eq("status", "approved")
      .not("latitude", "is", null)
      .not("longitude", "is", null)
      .limit(400);
    punktyRynek = mapujOgloszeniaRynekDlaMapy((wierszeRynek ?? []) as Parameters<typeof mapujOgloszeniaRynekDlaMapy>[0], wiesPoId);

    const { data: wierszeAdresy } = await supabase
      .from("address_points")
      .select("id, village_id, street_name, house_number, latitude, longitude")
      .in("village_id", idsWsi)
      .limit(3000);
    for (const a of wierszeAdresy ?? []) {
      const w = wiesPoId.get(a.village_id as string);
      if (!w) continue;
      const lat = doLiczby(a.latitude as string | number | null);
      const lon = doLiczby(a.longitude as string | number | null);
      if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
      punktyAdresy.push({
        id: a.id as string,
        villageId: a.village_id as string,
        villageName: w.name,
        streetName: (a.street_name as string | null) ?? null,
        houseNumber: String(a.house_number ?? "").trim() || "?",
        lat,
        lon,
      });
    }
  }

  const punktyZgloszenia: ZnacznikZgloszenie[] = [];
  const punktyPolowania: ZnacznikPolowanie[] = [];
  try {
    const sbAuth = utworzKlientaSupabaseSerwer();
    const {
      data: { user },
    } = await sbAuth.auth.getUser();
    if (user && znaczniki.length > 0) {
      const { data: roleRows } = await sbAuth
        .from("user_village_roles")
        .select("village_id")
        .eq("user_id", user.id)
        .eq("status", "active");
      const vids = Array.from(new Set((roleRows ?? []).map((r) => r.village_id)));
      if (vids.length > 0) {
        const wiesPoId = new Map(znaczniki.map((z) => [z.id, z.name]));
        const { data: issues } = await sbAuth
          .from("issues")
          .select("id, title, status, latitude, longitude, village_id")
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
            lat,
            lon,
            villageName: wiesPoId.get(iss.village_id) ?? "Wieś",
          });
        }
      }
    }
    if (supabase && znaczniki.length > 0) {
      const teraz = new Date().toISOString();
      const { data: polowania } = await supabase
        .from("village_hunting_notices")
        .select("id, title, area_description, area_geojson, starts_at, ends_at, village_id")
        .eq("status", "approved")
        .lte("starts_at", teraz)
        .gte("ends_at", teraz)
        .limit(80);
      for (const p of polowania ?? []) {
        const z = znaczniki.find((w) => w.id === p.village_id);
        if (!z) continue;
        const srodek = centroidObszaruPolowania(p.area_geojson) ?? { lat: z.lat, lng: z.lon };
        punktyPolowania.push({
          id: p.id,
          title: p.title,
          areaDescription: p.area_description,
          startsAt: p.starts_at as string,
          endsAt: p.ends_at as string,
          lat: srodek.lat,
          lon: srodek.lng,
          villageName: z.name,
          villageSciezka: z.sciezka,
          areaGeojson: p.area_geojson ?? null,
        });
      }
    }
  } catch {
    /* warstwy opcjonalne */
  }

  const liczbaWsi = znaczniki.length;
  const statystykiMapy: StatystykiMapy = obliczStatystykiMapy(znaczniki, punktyPoi);
  const villageIdsBezTransportu = wybierzWsiBezTransportuNaMapie(znaczniki, punktyPoi, 12);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-stone-50 text-stone-800">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(22,101,52,0.14),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_0%,rgba(180,83,9,0.08),transparent_45%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-32 top-1/3 h-72 w-72 rounded-full bg-emerald-400/15 blur-3xl motion-reduce:hidden md:animate-mapa-float"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-24 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl motion-reduce:hidden md:animate-mapa-float md:[animation-delay:1.2s]"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-[min(100%,1600px)] px-4 pb-12 pt-8 md:px-6 md:pb-16 md:pt-10">
        <p className="mb-5 text-sm text-stone-500 opacity-0 animate-mapa-reveal motion-reduce:animate-none motion-reduce:opacity-100">
          <Link href="/" className="rounded text-green-900 underline decoration-green-800/40 underline-offset-2 transition hover:decoration-green-800">
            ← Strona główna
          </Link>
          {" · "}
          <Link href="/szukaj" className="rounded text-green-900 underline decoration-green-800/40 underline-offset-2 transition hover:decoration-green-800">
            Szukaj wsi
          </Link>
        </p>

        <header className="max-w-4xl opacity-0 animate-mapa-reveal motion-reduce:animate-none motion-reduce:opacity-100 [animation-delay:0.06s]">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-green-900/15 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-900 shadow-sm backdrop-blur-sm">
              Atlas
            </span>
            {!bladZapytania && liczbaWsi > 0 ? (
              <span className="rounded-full border border-amber-900/10 bg-amber-50/90 px-3 py-1 text-xs font-medium text-amber-950 shadow-sm">
                {etykietaLiczbyWsi(liczbaWsi)}
              </span>
            ) : null}
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight text-green-950 md:text-5xl md:leading-[1.08]">
            <span className="bg-gradient-to-br from-green-950 via-emerald-800 to-green-900 bg-clip-text text-transparent">
              Mapa wiosek
            </span>
          </h1>
          <div
            className="mt-4 h-1 w-24 origin-left rounded-full bg-gradient-to-r from-green-700 via-emerald-500 to-amber-500 animate-mapa-hero-line motion-reduce:animate-none motion-reduce:scale-x-100 motion-reduce:opacity-100"
            aria-hidden="true"
          />
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-stone-600">
            Wybierz wsi z <strong>katalogu</strong> (województwo → powiat → gmina) albo wyszukaj po nazwie. Przy każdej wsi:
            obrys z PRG (gdy jest w bazie), punkt GPS oraz <strong>miejsca w sołectwie</strong> — kościół, szkoła, świetlica, OSP,
            punkt czerpania wody, stacja kolejowa. Włącz <strong>lokalizację</strong>, żeby sortować listę i zobaczyć wsie w promieniu km.
            Aktywne <strong>polowania</strong> są zaznaczone czerwonym obszarem — na liście po lewej kliknij wpis, by przybliżyć mapę.
            Sołtys może w panelu{" "}
            <Link href="/panel/soltys/moja-wies" className="font-medium text-green-900 underline decoration-green-800/35 underline-offset-2">
              Profil wsi
            </Link>{" "}
            dopisać brakujące miejsca z{" "}
            <a
              href="https://www.openstreetmap.org/"
              className="font-medium text-green-900 underline decoration-green-800/35 underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              OpenStreetMap
            </a>{" "}
            (import pomocniczy — warto zweryfikować na miejscu).
          </p>
        </header>

        {bladZapytania ? (
          <p
            className={`mt-6 rounded-xl px-4 py-3 text-sm ${znaczniki.length > 0 ? "border border-amber-200 bg-amber-50 text-amber-950" : "bg-red-50 text-red-800"}`}
            role="alert"
          >
            {bladZapytania}
          </p>
        ) : null}

        {!bladZapytania && znaczniki.length === 0 ? (
          <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            Brak aktywnych wsi z uzupełnionymi współrzędnymi. Po dodaniu wsi w bazie mapa się wypełni.
          </p>
        ) : null}

        {!bladZapytania && znaczniki.length > 0 ? (
          <div className="mt-10 overflow-hidden rounded-2xl border border-stone-200/70 bg-white/95 shadow-xl shadow-green-950/10 ring-1 ring-green-950/[0.06] opacity-0 animate-mapa-card-lift motion-reduce:animate-none motion-reduce:opacity-100 [animation-delay:0.12s]">
            <Suspense
              fallback={
                <div className="space-y-4 p-6 md:p-8">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-green-200 to-emerald-100" />
                    <div className="h-4 w-40 rounded-full bg-stone-200" />
                  </div>
                  <div
                    className="h-12 max-w-xl rounded-xl bg-gradient-to-r from-stone-200 from-30% via-stone-100 via-50% to-stone-200 to-70% bg-[length:220%_100%] animate-mapa-shimmer motion-reduce:animate-none"
                    role="status"
                    aria-label="Ładowanie mapy"
                  />
                  <div className="grid gap-3 md:grid-cols-[min(100%,280px)_1fr]">
                    <div className="space-y-2 rounded-xl border border-stone-100 bg-stone-50/80 p-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-10 rounded-lg bg-stone-200/80" style={{ opacity: 1 - i * 0.12 }} />
                      ))}
                    </div>
                    <div className="flex min-h-[280px] items-center justify-center rounded-xl border border-dashed border-green-900/15 bg-gradient-to-b from-stone-50 to-emerald-50/30 p-6 text-sm font-medium text-green-900/80">
                      Ładowanie mapy…
                    </div>
                  </div>
                </div>
              }
            >
              <MapaAutomatyzacjaKlient
                znaczniki={znaczniki}
                villageIdsBezTransportu={villageIdsBezTransportu}
                statystyki={statystykiMapy}
              />
              <MapaWsiStronaDynamic
                znaczniki={znaczniki}
                punktyPoi={punktyPoi}
                punktyAdresy={punktyAdresy}
                punktyRynek={punktyRynek}
                punktyZgloszenia={punktyZgloszenia}
                punktyPolowania={punktyPolowania}
                statystykiMapy={statystykiMapy}
              />
            </Suspense>
          </div>
        ) : null}
      </div>
    </main>
  );
}
