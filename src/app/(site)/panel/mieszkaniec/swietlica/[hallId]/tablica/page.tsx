import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TablicaCyfrowaKlient } from "@/components/grafika/tablica-cyfrowa-klient";
import { pobierzPublicznePlakatyWsi } from "@/app/(site)/panel/grafika/akcje";
import { PanelStronaMieszkaneca } from "@/components/panel/panel-strona-mieszkaneca";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
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
  await pobierzUzytkownikaPanelu();

  const { data: sala, error } = await supabase
    .from("halls")
    .select("id, name, village_id, villages(name)")
    .eq("id", hallId)
    .maybeSingle();

  if (error || !sala) notFound();

  const wies = pojedynczaWies<{ name: string }>(sala.villages);
  const plakaty = await pobierzPublicznePlakatyWsi(sala.village_id);

  return (
    <PanelStronaMieszkaneca
      tytul="Tablica cyfrowa"
      opis="Podgląd plakatów sołectwa na ekranie w sali. Sołtys włącza rotację w kreatorze grafiki."
      hrefPowrotu={`/panel/mieszkaniec/swietlica/${hallId}`}
      etykietaPowrotu="← Sala"
      szeroki
      dzieci={
        <>
          <NawigacjaSali hallId={hallId} rola="mieszkaniec" />
          <TablicaCyfrowaKlient plakaty={plakaty} nazwaSali={sala.name} nazwaWsi={wies?.name ?? "Wieś"} />
        </>
      }
    />
  );
}
