import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { formatujGodzinyOtwarcia, pobierzGodzinyOtwarciaListe } from "@/lib/mapa/formatuj-godziny-otwarcia";
import { opisZrodlaPoi } from "@/lib/mapa/etykieta-zrodla-poi";
import { pobierzKomentarzePoi } from "@/lib/mapa/pobierz-komentarze-poi";
import { createSeoMeta } from "@/lib/seo/create-seo-meta";
import type { ZnacznikPoi } from "@/components/mapa/mapa-wsi-leaflet";
import { MiejscePoiKlient } from "./miejsce-poi-klient";
import { RozkladPrzystankuPubliczny } from "@/components/mapa/rozklad-przystanku-publiczny";
import { pobierzPodgladOrganizacjiDlaPoi } from "@/lib/mapa/pobierz-organizacje-dla-poi";
import { pobierzWpisyKronikiDlaPoi } from "@/lib/mapa/pobierz-kronike-poi";
import { etykietaLinkuOrganizacjiDlaPoi } from "@/lib/mapa/powiazanie-poi-organizacja";
import { parsujZdjeciaProfiluPoi } from "@/lib/mapa/zdjecia-profilu-poi";

type Props = { params: { poiId: string } };

function tekstDoMeta(raw: string | null | undefined, max = 200): string {
  if (!raw?.trim()) return "";
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createPublicSupabaseClient();
  if (!supabase) return { title: "Miejsce na mapie" };

  const { data: poi } = await supabase
    .from("pois")
    .select("name, description, story_text, photo_url, villages(name)")
    .eq("id", params.poiId)
    .maybeSingle();

  if (!poi) return { title: "Miejsce na mapie" };

  const v = Array.isArray(poi.villages) ? poi.villages[0] : poi.villages;
  const nazwaWsi = (v as { name?: string } | null)?.name;
  const tytul = nazwaWsi ? `${poi.name} — ${nazwaWsi}` : String(poi.name);
  const opis =
    tekstDoMeta((poi as { story_text?: string | null }).story_text, 180) ||
    tekstDoMeta(poi.description, 180) ||
    `Profil miejsca ${poi.name} na mapie wsi${nazwaWsi ? ` ${nazwaWsi}` : ""}.`;

  return createSeoMeta({
    tytul,
    opis,
    sciezka: `/mapa/miejsce/${params.poiId}`,
    obrazOg: (poi as { photo_url?: string | null }).photo_url ?? null,
  });
}

export default async function MiejscePoiPage({ params }: Props) {
  const supabase = createPublicSupabaseClient();
  if (!supabase) notFound();

  const { data: poi } = await supabase
    .from("pois")
    .select(
      "id, village_id, category, name, description, latitude, longitude, phone, opening_hours, photo_url, photo_caption, story_text, facts_text, gallery_photos, source, verified_at, is_local_override, linked_group_id, villages(name, slug, voivodeship, county, commune)",
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

  const wiesDane = v
    ? {
        voivodeship: (v as { voivodeship: string }).voivodeship,
        county: (v as { county: string }).county,
        commune: (v as { commune: string }).commune,
        slug: (v as { slug: string }).slug,
      }
    : null;

  const [organizacja, wpisyKroniki, komentarze] = await Promise.all([
    wiesDane && poi.village_id
      ? pobierzPodgladOrganizacjiDlaPoi(supabase, {
          villageId: poi.village_id as string,
          kategoria: poi.category as string,
          linkedGroupId: (poi as { linked_group_id?: string | null }).linked_group_id ?? null,
          wies: wiesDane,
        })
      : Promise.resolve(null),
    wiesDane && poi.village_id
      ? pobierzWpisyKronikiDlaPoi(supabase, {
          poiId: poi.id as string,
          villageId: poi.village_id as string,
          sciezkaProfiluWsi: villageSciezka,
        })
      : Promise.resolve([]),
    pobierzKomentarzePoi(supabase, poi.id as string),
  ]);

  const godzinyRaw = (poi as { opening_hours?: unknown }).opening_hours;
  const zalogowany = Boolean(await pobierzUzytkownikaSerwer());
  const lat = Number(poi.latitude);
  const lon = Number(poi.longitude);
  const zrodlo = opisZrodlaPoi({
    source: (poi as { source?: string | null }).source ?? null,
    verified_at: (poi as { verified_at?: string | null }).verified_at ?? null,
    is_local_override: (poi as { is_local_override?: boolean | null }).is_local_override ?? null,
  });

  const pinezkaMapy: ZnacznikPoi = {
    id: poi.id,
    villageId: poi.village_id,
    villageName: (v as { name?: string } | null)?.name ?? "Wieś",
    sciezkaWsi: villageSciezka,
    category: poi.category,
    name: poi.name,
    description: poi.description,
    lat,
    lon,
    photoUrl: (poi as { photo_url?: string | null }).photo_url ?? null,
    photoCaption: (poi as { photo_caption?: string | null }).photo_caption ?? null,
    phone: (poi as { phone?: string | null }).phone?.trim() || null,
    openingHours: (poi as { opening_hours?: unknown }).opening_hours,
  };

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
        godziny={formatujGodzinyOtwarcia(godzinyRaw)}
        godzinyLista={pobierzGodzinyOtwarciaListe(godzinyRaw)}
        villageName={(v as { name?: string } | null)?.name ?? "Wieś"}
        villageSciezka={villageSciezka}
        lat={lat}
        lon={lon}
        komentarze={komentarze}
        zalogowany={zalogowany}
        pinezkaMapy={pinezkaMapy}
        zrodloTekst={zrodlo.tekst}
        zrodloKlasy={zrodlo.klasy}
        wymagaWeryfikacji={zrodlo.wymagaWeryfikacji}
        organizacja={organizacja}
        pokazPodpowiedzOrganizacji={!organizacja && Boolean(etykietaLinkuOrganizacjiDlaPoi(poi.category as string))}
        historia={(poi as { story_text?: string | null }).story_text ?? null}
        ciekawostki={(poi as { facts_text?: string | null }).facts_text ?? null}
        galeria={parsujZdjeciaProfiluPoi((poi as { gallery_photos?: unknown }).gallery_photos)}
        wpisyKroniki={wpisyKroniki}
        sciezkaKronikiWsi={villageSciezka}
      />
      <div className="mt-6">
        <RozkladPrzystankuPubliczny poiId={poi.id} kategoria={poi.category} />
      </div>
    </main>
  );
}
