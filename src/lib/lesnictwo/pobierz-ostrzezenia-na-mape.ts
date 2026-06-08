import type { ZnacznikWsi } from "@/components/mapa/mapa-wsi-leaflet";
import { czyRodzajOstrzezeniaLesnego } from "@/lib/lesnictwo/kategorie-ostrzezen";
import { centroidObszaruPolowania } from "@/lib/lowiectwo/geojson-obszar";
import { fazaPolowania, type FazaPolowaniaMapy } from "@/lib/mapa/formatuj-polowanie";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

export type ZnacznikOstrzezeniaLesnego = {
  id: string;
  noticeKind: string;
  title: string;
  areaDescription: string;
  startsAt: string;
  endsAt: string;
  lat: number;
  lon: number;
  villageId: string;
  villageName: string;
  villageSciezka: string;
  areaGeojson: unknown | null;
  faza: FazaPolowaniaMapy;
};

const HORYZONT_DNI = 60;

/** Aktywne i nadchodzące ostrzeżenia leśne na mapie katalogu. */
export async function pobierzOstrzezeniaLesneNaMape(
  znaczniki: ZnacznikWsi[],
): Promise<ZnacznikOstrzezeniaLesnego[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase || znaczniki.length === 0) return [];

  const teraz = new Date();
  const horyzont = new Date(teraz);
  horyzont.setDate(horyzont.getDate() + HORYZONT_DNI);

  const { data } = await supabase
    .from("village_forestry_notices")
    .select("id, notice_kind, title, area_description, area_geojson, starts_at, ends_at, village_id")
    .eq("status", "approved")
    .gte("ends_at", teraz.toISOString())
    .order("starts_at", { ascending: true })
    .limit(120);

  const wiesPoId = new Map(znaczniki.map((z) => [z.id, z]));
  const wynik: ZnacznikOstrzezeniaLesnego[] = [];

  for (const p of data ?? []) {
    const start = new Date(p.starts_at as string);
    const faza = fazaPolowania(p.starts_at as string, p.ends_at as string, teraz);
    if (faza === "nadchodzace" && start > horyzont) continue;

    const z = wiesPoId.get(p.village_id as string);
    if (!z) continue;
    const kindRaw = String(p.notice_kind ?? "inne");
    const srodek = centroidObszaruPolowania(p.area_geojson) ?? { lat: z.lat, lng: z.lon };
    wynik.push({
      id: p.id as string,
      noticeKind: czyRodzajOstrzezeniaLesnego(kindRaw) ? kindRaw : "inne",
      title: p.title as string,
      areaDescription: p.area_description as string,
      startsAt: p.starts_at as string,
      endsAt: p.ends_at as string,
      lat: srodek.lat,
      lon: srodek.lng,
      villageId: z.id,
      villageName: z.name,
      villageSciezka: z.sciezka,
      areaGeojson: p.area_geojson ?? null,
      faza,
    });
  }

  return wynik;
}
