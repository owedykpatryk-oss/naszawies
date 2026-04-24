import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MapaWsiStrona } from "@/components/mapa/mapa-wsi-strona";
import type { ZnacznikWsi } from "@/components/mapa/mapa-wsi-leaflet";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

export const metadata: Metadata = {
  title: "Mapa wsi",
  description: "Mapa aktywnych profili wiosek na naszawies.pl — szybki podgląd lokalizacji i przejście do strony wsi.",
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

export default async function MapaPage() {
  const supabase = createPublicSupabaseClient();
  let znaczniki: ZnacznikWsi[] = [];
  let bladZapytania: string | null = null;

  if (!supabase) {
    bladZapytania = "Brak konfiguracji Supabase (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).";
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
      const opisRpc = error?.message ?? "Nie udało się wczytać mapy (sprawdź migracje: mapa_wsi_znaczniki).";
      const { data: wiersze, error: err2 } = await supabase
        .from("villages")
        .select("id, name, slug, voivodeship, county, commune, teryt_id, latitude, longitude, population, boundary_geojson")
        .eq("is_active", true)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("name", { ascending: true })
        .limit(500);

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
        bladZapytania = error ? `${opisRpc} · Lista wsi bez liczników ofert (tryb awaryjny).` : null;
      }
    }
  }

  const liczbaWsi = znaczniki.length;

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

      <div className="relative mx-auto max-w-[1400px] px-4 pb-12 pt-8 md:px-6 md:pb-16 md:pt-10">
        <p className="mb-5 text-sm text-stone-500 opacity-0 animate-mapa-reveal motion-reduce:animate-none motion-reduce:opacity-100">
          <Link href="/" className="rounded text-green-900 underline decoration-green-800/40 underline-offset-2 transition hover:decoration-green-800">
            ← Strona główna
          </Link>
          {" · "}
          <Link href="/szukaj" className="rounded text-green-900 underline decoration-green-800/40 underline-offset-2 transition hover:decoration-green-800">
            Szukaj wsi
          </Link>
        </p>

        <header className="max-w-3xl opacity-0 animate-mapa-reveal motion-reduce:animate-none motion-reduce:opacity-100 [animation-delay:0.06s]">
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
              <MapaWsiStrona znaczniki={znaczniki} />
            </Suspense>
          </div>
        ) : null}
      </div>
    </main>
  );
}
