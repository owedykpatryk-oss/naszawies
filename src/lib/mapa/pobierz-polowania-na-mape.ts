import type { ZnacznikPolowanie, ZnacznikWsi } from "@/components/mapa/mapa-wsi-leaflet";
import { centroidObszaruPolowania } from "@/lib/lowiectwo/geojson-obszar";
import { fazaPolowania } from "@/lib/mapa/formatuj-polowanie";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";

const HORYZONT_DNI = 45;

/** Aktywne i nadchodzące (do 45 dni) ostrzeżenia polowania na mapie katalogu. */
export async function pobierzPolowaniaNaMape(znaczniki: ZnacznikWsi[]): Promise<ZnacznikPolowanie[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase || znaczniki.length === 0) return [];

  const teraz = new Date();
  const horyzont = new Date(teraz);
  horyzont.setDate(horyzont.getDate() + HORYZONT_DNI);

  const { data } = await supabase
    .from("village_hunting_notices")
    .select("id, title, area_description, area_geojson, starts_at, ends_at, village_id")
    .eq("status", "approved")
    .gte("ends_at", teraz.toISOString())
    .order("starts_at", { ascending: true })
    .limit(120);

  const wiesPoId = new Map(znaczniki.map((z) => [z.id, z]));
  const wynik: ZnacznikPolowanie[] = [];

  for (const p of data ?? []) {
    const start = new Date(p.starts_at as string);
    const faza = fazaPolowania(p.starts_at as string, p.ends_at as string, teraz);
    if (faza === "nadchodzace" && start > horyzont) continue;

    const z = wiesPoId.get(p.village_id as string);
    if (!z) continue;
    const srodek = centroidObszaruPolowania(p.area_geojson) ?? { lat: z.lat, lng: z.lon };
    wynik.push({
      id: p.id as string,
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
