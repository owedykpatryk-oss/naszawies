import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TablicaCyfrowaKlient } from "@/components/grafika/tablica-cyfrowa-klient";
import { pobierzPlakatyTablicyCyfrowejWsi } from "@/app/(site)/panel/grafika/akcje";
import { czyUzytkownikJestSoltysemDlaSali } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { NawigacjaSali } from "@/components/swietlica/nawigacja-sali";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";

type Props = { params: { hallId: string } };

export const metadata: Metadata = {
  title: "Tablica cyfrowa świetlicy",
};

export default async function SoltysTablicaCyfrowaPage({ params }: Props) {
  const hallId = params.hallId;
  const uuidOk = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(hallId);
  if (!uuidOk) notFound();

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/logowanie?next=/panel/soltys/swietlica/${hallId}/tablica`);
  }

  const { data: sala } = await supabase
    .from("halls")
    .select("id, name, village_id, villages(name)")
    .eq("id", hallId)
    .maybeSingle();

  if (!sala) notFound();

  const wolno = await czyUzytkownikJestSoltysemDlaSali(supabase, user.id, hallId);
  if (!wolno) notFound();

  const wies = pojedynczaWies<{ name: string }>(sala.villages);
  const plakaty = await pobierzPlakatyTablicyCyfrowejWsi(sala.village_id);

  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href={`/panel/soltys/swietlica/${hallId}`} className="text-green-800 underline">
          ← Sala
        </Link>
      </p>
      <h1 className="tytul-sekcji-panelu">Tablica cyfrowa</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">
        Tryb pełnoekranowy na telewizorze w świetlicy — rotacja opublikowanych plakatów. Włącz plakat w kreatorze
        grafiki („Pokaż na tablicy świetlicy”).
      </p>

      <div className="mt-6">
        <NawigacjaSali hallId={hallId} rola="soltys" />
        <TablicaCyfrowaKlient
          plakaty={plakaty}
          nazwaSali={sala.name}
          nazwaWsi={wies?.name ?? "Wieś"}
        />
      </div>
    </main>
  );
}
