import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { SekcjaSzkolaTablicaKlient } from "@/components/wies/sekcja-szkola-tablica-klient";
import { KartaSzkolyPubliczna, type DaneSzkolyPubliczne } from "@/components/wies/karta-szkoly-publiczna";
import { pobierzOgloszeniaSzkolyPubliczne } from "@/lib/szkola/pobierz-ogloszenia-szkoly";
import { parsujProfilSzkoly, czyOrganizacjaSzkola } from "@/lib/wies/profil-organizacji";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

type Props = { params: { villageId: string } };

export const revalidate = 120;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data } = await supabase.from("villages").select("name").eq("id", params.villageId).maybeSingle();
  return {
    title: data?.name ? `Tablica szkoły — ${data.name}` : "Tablica szkoły",
    robots: { index: false, follow: false },
  };
}

export default async function EmbedSzkolaWsiPage({ params }: Props) {
  const id = z.string().uuid().safeParse(params.villageId);
  if (!id.success) notFound();

  const supabase = utworzKlientaSupabaseSerwer();
  const { data: wies } = await supabase
    .from("villages")
    .select("id, name, voivodeship, county, commune, slug, is_active")
    .eq("id", id.data)
    .maybeSingle();

  if (!wies?.is_active) notFound();

  const { data: grupy } = await supabase
    .from("village_community_groups")
    .select("id, group_type, name, short_description, meeting_place, schedule_text, contact_phone, contact_email, profile_data")
    .eq("village_id", wies.id)
    .eq("is_active", true);

  const szkoly: DaneSzkolyPubliczne[] = (grupy ?? [])
    .filter((g) => czyOrganizacjaSzkola(g.group_type, g.name))
    .map((g) => ({
      id: g.id as string,
      name: g.name as string,
      short_description: (g.short_description as string | null) ?? null,
      meeting_place: (g.meeting_place as string | null) ?? null,
      schedule_text: (g.schedule_text as string | null) ?? null,
      contact_phone: (g.contact_phone as string | null) ?? null,
      contact_email: (g.contact_email as string | null) ?? null,
      profil: parsujProfilSzkoly(g.profile_data),
    }));

  const ogloszenia = await pobierzOgloszeniaSzkolyPubliczne(supabase, wies.id, 30);
  const sciezka = sciezkaProfiluWsi(wies);

  return (
    <main className="min-w-0 bg-white p-4 text-stone-800">
      <header className="border-b border-stone-200 pb-3">
        <p className="text-xs font-bold uppercase tracking-wide text-sky-800">naszawies.pl</p>
        <h1 className="font-serif text-lg text-green-950">Tablica — {wies.name}</h1>
        <a href={`${sciezka}#sekcja-szkola`} className="mt-1 inline-block text-xs text-green-800 underline">
          Pełny profil wsi
        </a>
      </header>
      {szkoly[0] ? (
        <div className="mt-4">
          <KartaSzkolyPubliczna szkola={szkoly[0]} />
        </div>
      ) : null}
      <SekcjaSzkolaTablicaKlient ogloszenia={ogloszenia} nazwaSzkoly={szkoly[0]?.name ?? wies.name} />
    </main>
  );
}
