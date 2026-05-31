import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { SoltysSamorzadKlient, type PrzewodnikWiersz, type WiesDoSamorzadu } from "./samorzad-klient";

export const metadata: Metadata = {
  title: "Przewodnik samorządowy",
};

export default async function SoltysSamorzadPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/samorzad");
  }
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (villageIds.length === 0) {
    return (
      <PanelStronaSoltysa
        tytul="Przewodnik samorządowy"
        opis="Brak przypisanej wsi w roli sołtysa lub współadmina."
        dzieci={null}
      />
    );
  }

  const { data: rows } = await supabase.from("villages").select("id, name").in("id", villageIds).order("name");
  const wsie: WiesDoSamorzadu[] = (rows ?? []).map((r) => ({ id: r.id, name: r.name }));

  const { data: guideRows } = await supabase
    .from("village_civic_guides")
    .select(
      "village_id, commune_info, county_info, voivodeship_info, roads_info, waste_info, utilities_info, other_info",
    )
    .in("village_id", villageIds);
  const wpisy = (guideRows ?? []) as PrzewodnikWiersz[];

  return (
    <PanelStronaSoltysa
      tytul="Przewodnik: gmina, powiat, województwo"
      opis={
        <>
          Uzupełnij kontakty i lokalne zasady — na profilu wsi mieszkańcy zobaczą je obok ogólnego skrótu kompetencji
          (nie zastępuje porady prawnej ani aktów urzędowych).
        </>
      }
      dzieci={<SoltysSamorzadKlient wsie={wsie} wpisy={wpisy} />}
    />
  );
}
