import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { HistoriaLiniaCzasuKlient } from "@/components/wies/historia-linia-czasu-klient";
import { MapaHistoriaWsiEmbedded } from "@/components/wies/mapa-historia-wsi-embedded";
import { pobierzHistoriePublicznaWsi } from "@/lib/historia/pobierz-historie-wsi";
import { znacznikiHistoriiNaMapie } from "@/lib/historia/znaczniki-historii-na-mapie";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

type Props = { params: { villageId: string } };

export const revalidate = 120;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data } = await supabase.from("villages").select("name").eq("id", params.villageId).maybeSingle();
  return {
    title: data?.name ? `Historia — ${data.name}` : "Historia wsi",
    robots: { index: false, follow: false },
  };
}

export default async function EmbedHistoriaWsiPage({ params }: Props) {
  const id = z.string().uuid().safeParse(params.villageId);
  if (!id.success) notFound();

  const supabase = utworzKlientaSupabaseSerwer();
  const { data: wies } = await supabase
    .from("villages")
    .select("id, name, voivodeship, county, commune, slug, is_active")
    .eq("id", id.data)
    .maybeSingle();

  if (!wies?.is_active) notFound();

  const wpisy = await pobierzHistoriePublicznaWsi(supabase, wies.id, 12);
  const sciezka = sciezkaProfiluWsi(wies);
  const pinezki = znacznikiHistoriiNaMapie(wpisy, wies.id, wies.name, sciezka);

  return (
    <main className="min-w-0 bg-white p-4 text-stone-800">
      <header className="border-b border-amber-200/60 pb-3">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-900">naszawies.pl</p>
        <h1 className="font-serif text-lg text-green-950">Kronika — {wies.name}</h1>
        <a href={`${sciezka}#sekcja-historia`} className="mt-1 inline-block text-xs text-green-800 underline">
          Pełny profil wsi
        </a>
      </header>
      {pinezki.length > 0 ? (
        <div className="mt-4">
          <MapaHistoriaWsiEmbedded pinezki={pinezki} />
        </div>
      ) : null}
      {wpisy.length === 0 ? (
        <p className="mt-6 text-sm text-stone-500">Brak opublikowanych wpisów historii.</p>
      ) : (
        <HistoriaLiniaCzasuKlient wpisy={wpisy} sciezkaProfilu={sciezka} />
      )}
    </main>
  );
}
