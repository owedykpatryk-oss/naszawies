import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TablicaCyfrowaKlient } from "@/components/grafika/tablica-cyfrowa-klient";
import { pobierzPublicznePlakatyWsi } from "@/app/(site)/panel/grafika/akcje";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { NawigacjaSali } from "@/components/swietlica/nawigacja-sali";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";

type Props = { params: { hallId: string } };

export const metadata: Metadata = {
  title: "Tablica cyfrowa",
};

export default async function MieszkaniecTablicaCyfrowaPage({ params }: Props) {
  const hallId = params.hallId;
  const uuidOk = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(hallId);
  if (!uuidOk) notFound();

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/logowanie?next=/panel/mieszkaniec/swietlica/${hallId}/tablica`);
  }

  const { data: sala, error } = await supabase
    .from("halls")
    .select("id, name, village_id, villages(name)")
    .eq("id", hallId)
    .maybeSingle();

  if (error || !sala) notFound();

  const wies = pojedynczaWies<{ name: string }>(sala.villages);
  const plakaty = await pobierzPublicznePlakatyWsi(sala.village_id);

  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href={`/panel/mieszkaniec/swietlica/${hallId}`} className="text-green-800 underline">
          ← Sala
        </Link>
      </p>
      <h1 className="tytul-sekcji-panelu">Tablica cyfrowa</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">
        Podgląd plakatów sołectwa na ekranie w sali. Sołtys włącza rotację w kreatorze grafiki.
      </p>

      <div className="mt-6">
        <NawigacjaSali hallId={hallId} rola="mieszkaniec" />
        <TablicaCyfrowaKlient
          plakaty={plakaty}
          nazwaSali={sala.name}
          nazwaWsi={wies?.name ?? "Wieś"}
        />
      </div>
    </main>
  );
}
