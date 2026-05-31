import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { formatujGodzinyOtwarcia } from "@/lib/mapa/formatuj-godziny-otwarcia";
import { etykietaZrodlaPoi } from "@/lib/mapa/etykieta-zrodla-poi";
import { MiejscePoiKlient, type KomentarzPoiWiersz } from "./miejsce-poi-klient";
import { RozkladPrzystankuPubliczny } from "@/components/mapa/rozklad-przystanku-publiczny";

type Props = { params: { poiId: string } };

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Miejsce na mapie" };
}

export default async function MiejscePoiPage({ params }: Props) {
  const supabase = createPublicSupabaseClient();
  if (!supabase) notFound();

  const { data: poi } = await supabase
    .from("pois")
    .select(
      "id, village_id, category, name, description, latitude, longitude, phone, opening_hours, photo_url, photo_caption, source, verified_at, is_local_override, villages(name, slug, voivodeship, county, commune)",
    )
    .eq("id", params.poiId)
    .maybeSingle();

  if (!poi) notFound();

  const v = Array.isArray(poi.villages) ? poi.villages[0] : poi.villages;
  const villageSciezka = v
    ? sciezkaProfiluWsi({
        voivodeship: (v as { voivodeship: string }).voivodeship,
        county: (v as { county: string }).county,
        commune: (v as { commune: string }).commune,
        slug: (v as { slug: string }).slug,
      })
    : "/mapa";

  const { data: komentarzeRaw } = await supabase
    .from("poi_comments")
    .select("id, body, created_at, author_id")
    .eq("poi_id", poi.id)
    .eq("status", "visible")
    .order("created_at", { ascending: true })
    .limit(80);

  const komentarze: KomentarzPoiWiersz[] = (komentarzeRaw ?? []).map((k, i) => ({
    id: k.id as string,
    body: k.body as string,
    createdAt: k.created_at as string,
    authorLabel: `Mieszkaniec ${i + 1}`,
  }));

  let zalogowany = false;
  try {
    const serwer = utworzKlientaSupabaseSerwer();
    const {
      data: { session },
    } = await serwer.auth.getSession();
    zalogowany = Boolean(session?.user);
  } catch {
    zalogowany = false;
  }

  const lat = Number(poi.latitude);
  const lon = Number(poi.longitude);
  const zrodlo = etykietaZrodlaPoi({
    source: (poi as { source?: string | null }).source ?? null,
    verified_at: (poi as { verified_at?: string | null }).verified_at ?? null,
    is_local_override: (poi as { is_local_override?: boolean | null }).is_local_override ?? null,
  });

  return (
    <main className="mx-auto min-h-[70vh] w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <MiejscePoiKlient
        poiId={poi.id}
        nazwa={poi.name}
        kategoria={poi.category}
        opis={poi.description}
        photoUrl={(poi as { photo_url?: string | null }).photo_url ?? null}
        photoCaption={(poi as { photo_caption?: string | null }).photo_caption ?? null}
        telefon={(poi as { phone?: string | null }).phone?.trim() || null}
        godziny={formatujGodzinyOtwarcia((poi as { opening_hours?: unknown }).opening_hours)}
        villageName={(v as { name?: string } | null)?.name ?? "Wieś"}
        villageSciezka={villageSciezka}
        lat={lat}
        lon={lon}
        komentarze={komentarze}
        zalogowany={zalogowany}
        zrodloTekst={zrodlo.tekst}
        zrodloKlasy={zrodlo.klasy}
        wymagaWeryfikacji={zrodlo.wymagaWeryfikacji}
      />
      <div className="mt-6">
        <RozkladPrzystankuPubliczny poiId={poi.id} kategoria={poi.category} />
      </div>
    </main>
  );
}
