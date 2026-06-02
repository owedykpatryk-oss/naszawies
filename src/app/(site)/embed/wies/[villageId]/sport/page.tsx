import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { SportListaFiltryKlient } from "@/components/wies/sport-lista-filtry-klient";
import { ListaAktywnosciFitness, PodsumowanieAktywnosciFitness } from "@/components/wies/aktywnosc-fitness-wsi";
import { nazwaDniaTygodnia } from "@/lib/wies/teksty-dotacji";
import { pobierzTerminarzSportuWsi } from "@/lib/wies/pobierz-terminarz-sportu-wsi";
import {
  pobierzAktywnosciFitnessWsi,
  pobierzPodsumowanieAktywnosciFitnessWsi,
} from "@/lib/wies/pobierz-aktywnosci-fitness-wsi";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

type Props = { params: { villageId: string } };

export const revalidate = 120;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data } = await supabase.from("villages").select("name").eq("id", params.villageId).maybeSingle();
  return {
    title: data?.name ? `Sport — ${data.name}` : "Terminarz sportowy",
    robots: { index: false, follow: false },
  };
}

export default async function EmbedSportWsiPage({ params }: Props) {
  const id = z.string().uuid().safeParse(params.villageId);
  if (!id.success) notFound();

  const supabase = utworzKlientaSupabaseSerwer();
  const { data: wies } = await supabase
    .from("villages")
    .select("id, name, voivodeship, county, commune, slug, is_active")
    .eq("id", id.data)
    .maybeSingle();

  if (!wies?.is_active) notFound();

  const sciezka = sciezkaProfiluWsi(wies);
  const [{ wydarzenia, treningi }, aktywnosciFitness, podsumowanieFitness] = await Promise.all([
    pobierzTerminarzSportuWsi(supabase, wies.id),
    pobierzAktywnosciFitnessWsi(wies.id, 8),
    pobierzPodsumowanieAktywnosciFitnessWsi(wies.id),
  ]);

  return (
    <main className="min-w-0 bg-white p-4 text-stone-800">
      <header className="border-b border-emerald-200/60 pb-3">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-900">naszawies.pl</p>
        <h1 className="font-serif text-lg text-green-950">Sport — {wies.name}</h1>
        <a href={`${sciezka}#sekcja-sport`} className="mt-1 inline-block text-xs text-green-800 underline">
          Pełny profil wsi
        </a>
      </header>
      <PodsumowanieAktywnosciFitness podsumowanie={podsumowanieFitness} />
      {aktywnosciFitness.length > 0 ? (
        <ListaAktywnosciFitness aktywnosci={aktywnosciFitness} villageId={wies.id} />
      ) : null}
      {treningi.length > 0 ? (
        <div className="mt-4">
          <h2 className="text-xs font-semibold uppercase text-stone-500">Plan tygodnia</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {treningi.slice(0, 8).map((s) => (
              <li key={s.id}>
                <strong>{nazwaDniaTygodnia(s.day_of_week)}</strong> {s.time_start.slice(0, 5)}
                {s.time_end ? `–${s.time_end.slice(0, 5)}` : ""} — {s.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {wydarzenia.length === 0 ? (
        treningi.length === 0 && aktywnosciFitness.length === 0 ? (
          <p className="mt-6 text-sm text-stone-500">Brak opublikowanych informacji sportowych.</p>
        ) : null
      ) : (
        <SportListaFiltryKlient wydarzenia={wydarzenia} sciezkaProfilu={sciezka} />
      )}
    </main>
  );
}
