import type { Metadata } from "next";
import Link from "next/link";
import { MapaWsiOsm } from "@/components/mapa/mapa-wsi-osm";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

export const metadata: Metadata = {
  title: "Mapa wsi",
  description: "Aktywne profile miejscowości z katalogu naszawies.pl (współrzędne z bazy).",
};

type Wiersz = {
  id: string;
  name: string;
  slug: string;
  voivodeship: string;
  county: string;
  commune: string;
  latitude: number | null;
  longitude: number | null;
};

export default async function MapaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data, error } = await supabase
    .from("villages")
    .select("id, name, slug, voivodeship, county, commune, latitude, longitude")
    .eq("is_active", true)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("name", { ascending: true })
    .limit(400);

  const wiersze = (data ?? []) as Wiersz[];
  const punkty = wiersze
    .filter((w) => w.latitude != null && w.longitude != null)
    .map((w) => ({
      id: w.id,
      nazwa: w.name,
      sciezka: sciezkaProfiluWsi({
        voivodeship: w.voivodeship,
        county: w.county,
        commune: w.commune,
        slug: w.slug,
      }),
      lat: Number(w.latitude),
      lon: Number(w.longitude),
    }));

  return (
    <main className="mx-auto max-w-3xl px-5 py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
        {" · "}
        <Link href="/szukaj" className="text-green-800 underline">
          Szukaj wsi
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Mapa aktywnych wsi</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        Lista miejscowości z włączonym profilem (<code className="rounded bg-stone-100 px-1 text-xs">is_active</code>)
        oraz uzupełnionymi współrzędnymi. Pełny katalog TERYT importujesz skryptem — patrz{" "}
        <code className="rounded bg-stone-100 px-1 text-xs">npm run import-teryt-powiat</code>.
      </p>

      {error ? (
        <p className="mt-8 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          Nie udało się pobrać danych ({error.message}).
        </p>
      ) : null}

      {!error && punkty.length === 0 ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Brak aktywnych wsi z wypełnioną szerokością i długością geograficzną. Po dodaniu wsi w bazie (np. migracja
          seed) współrzędne pozwolą pokazać mapę regionu.
        </p>
      ) : null}

      {!error && punkty.length > 0 ? (
        <>
          <div className="mt-10">
            <MapaWsiOsm punkty={punkty} />
          </div>
          <section className="mt-10">
            <h2 className="font-serif text-xl text-green-950">Lista ({punkty.length})</h2>
            <ul className="mt-4 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
              {punkty.map((p) => (
                <li key={p.id}>
                  <Link
                    href={p.sciezka}
                    className="flex flex-col gap-0.5 px-4 py-3 text-sm hover:bg-green-50/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-medium text-stone-900">{p.nazwa}</span>
                    <span className="text-xs text-stone-500">
                      {p.lat.toFixed(4)}, {p.lon.toFixed(4)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </main>
  );
}
