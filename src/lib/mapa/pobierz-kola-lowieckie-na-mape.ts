import type { ZnacznikKoloLowieckie, ZnacznikWsi } from "@/components/mapa/mapa-wsi-leaflet";
import { czyOrganizacjaLowiecka, parsujProfilLowiecki } from "@/lib/wies/profil-organizacji";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
/** Lekkie przesunięcie pinezki gdy kilka kół w jednej wsi (hash id). */
function przesunieciePinezki(id: string): { dLat: number; dLon: number } {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const a = ((h & 0xffff) / 0xffff) * Math.PI * 2;
  const r = 0.004 + ((h >> 16) & 0xff) / 0xff * 0.006;
  return { dLat: Math.sin(a) * r, dLon: Math.cos(a) * r };
}

export async function pobierzKolaLowieckieNaMape(znaczniki: ZnacznikWsi[]): Promise<ZnacznikKoloLowieckie[]> {
  const supabase = createPublicSupabaseClient();
  if (!supabase || znaczniki.length === 0) return [];

  const idsWsi = znaczniki.map((z) => z.id);
  const { data } = await supabase
    .from("village_community_groups")
    .select("id, village_id, group_type, name, contact_phone, meeting_place, profile_data")
    .in("village_id", idsWsi)
    .eq("is_active", true)
    .limit(400);

  const wiesPoId = new Map(znaczniki.map((z) => [z.id, z]));
  const wynik: ZnacznikKoloLowieckie[] = [];

  for (const row of data ?? []) {
    const typ = String(row.group_type ?? "");
    const nazwa = String(row.name ?? "");
    if (!czyOrganizacjaLowiecka(typ, nazwa)) continue;
    const z = wiesPoId.get(row.village_id as string);
    if (!z) continue;
    const profil = parsujProfilLowiecki(row.profile_data);
    const { dLat, dLon } = przesunieciePinezki(row.id as string);
    wynik.push({
      id: row.id as string,
      name: nazwa,
      villageId: z.id,
      villageName: z.name,
      sciezkaWsi: z.sciezka,
      lat: z.lat + dLat,
      lon: z.lon + dLon,
      contactPhone: (row.contact_phone as string | null) ?? null,
      meetingPlace: (row.meeting_place as string | null) ?? profil?.siedziba_kola ?? null,
      numerKola: profil?.numer_kola ?? null,
      obszarSkrot: profil?.obszar_lowiecki?.trim().slice(0, 120) ?? null,
    });
  }

  return wynik;
}
