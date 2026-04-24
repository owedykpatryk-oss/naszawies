import type { Metadata } from "next";
import Link from "next/link";
import { MapaWsiStrona } from "@/components/mapa/mapa-wsi-strona";
import type { ZnacznikWsi } from "@/components/mapa/mapa-wsi-leaflet";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

export const metadata: Metadata = {
  title: "Mapa wsi",
  description:
    "Interaktywna mapa aktywnych wiosek na naszawies.pl — znaczniki, granice (gdzie dostępne), publiczne oferty z targu lokalnego.",
};

type WierszRpc = {
  id: string;
  name: string;
  slug: string;
  voivodeship: string;
  county: string;
  commune: string;
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

export default async function MapaPage() {
  const supabase = createPublicSupabaseClient();
  let znaczniki: ZnacznikWsi[] = [];
  let bladZapytania: string | null = null;

  if (!supabase) {
    bladZapytania = "Brak konfiguracji Supabase (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).";
  } else {
    const { data, error } = await supabase.rpc("mapa_wsi_znaczniki");

    if (!error && data && Array.isArray(data)) {
      znaczniki = (data as WierszRpc[])
        .map((w) => {
          const lat = doLiczby(w.latitude);
          const lon = doLiczby(w.longitude);
          if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
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
            population: w.population,
            boundary_geojson: w.boundary_geojson,
            public_offers_count: doLiczbyCalkowitej(w.public_offers_count),
          } satisfies ZnacznikWsi;
        })
        .filter((x): x is ZnacznikWsi => x !== null);
    } else {
      const opisRpc = error?.message ?? "Nie udało się wczytać mapy (sprawdź migracje: mapa_wsi_znaczniki).";
      const { data: wiersze, error: err2 } = await supabase
        .from("villages")
        .select("id, name, slug, voivodeship, county, commune, latitude, longitude, population, boundary_geojson")
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
          };
        });
        bladZapytania = error ? `${opisRpc} · Lista wsi bez liczników ofert (tryb awaryjny).` : null;
      }
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800">
      <div className="mx-auto max-w-[1400px] px-4 pb-10 pt-8 md:px-6">
        <p className="mb-4 text-sm text-stone-500">
          <Link href="/" className="text-green-800 underline">
            ← Strona główna
          </Link>
          {" · "}
          <Link href="/szukaj" className="text-green-800 underline">
            Szukaj wsi (TERYT)
          </Link>
        </p>
        <h1 className="font-serif text-3xl text-green-950 md:text-4xl">Mapa wiosek</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600 md:text-base">
          Aktywne profile z GPS. Gdzie w bazie jest <strong>granica GeoJSON</strong>, zobaczysz ją na mapie;
          pozostałe — znacznik w centrum (granice można importować do kolumny{" "}
          <code className="rounded bg-stone-100 px-1 text-xs">boundary_geojson</code>). Licznik to{" "}
          <strong>publiczne oferty</strong> typu targ lokalny (widoczne dla każdego).
        </p>

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
          <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm">
            <MapaWsiStrona znaczniki={znaczniki} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
