import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TablicaCyfrowaKlient } from "@/components/grafika/tablica-cyfrowa-klient";
import { pobierzPlakatyTablicyCyfrowejWsi } from "@/app/(site)/panel/grafika/akcje";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { czyUzytkownikJestSoltysemDlaSali } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
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
  const user = await pobierzUzytkownikaPanelu();

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
    <PanelStronaSoltysa
      tytul="Tablica cyfrowa"
      opis="Tryb pełnoekranowy na telewizorze w świetlicy — rotacja opublikowanych plakatów. Włącz plakat w kreatorze grafiki („Pokaż na tablicy świetlicy”)."
      powrotHref={`/panel/soltys/swietlica/${hallId}`}
      powrotEtykieta="← Sala"
      szeroki
      dzieci={
        <>
          <NawigacjaSali hallId={hallId} rola="soltys" />
          <TablicaCyfrowaKlient plakaty={plakaty} nazwaSali={sala.name} nazwaWsi={wies?.name ?? "Wieś"} />
        </>
      }
    />
  );
}
