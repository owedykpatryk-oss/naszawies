import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { SoltysSamorzadKlient, type PrzewodnikWiersz, type WiesDoSamorzadu } from "./samorzad-klient";

export const metadata: Metadata = {
  title: "Przewodnik samorządowy",
};

export default async function SoltysSamorzadPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/samorzad");
  }
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (villageIds.length === 0) {
    return (
      <main>
        <p className="mb-4 text-sm text-stone-500">
          <Link href="/panel/soltys" className="text-green-800 underline">
            ← Panel sołtysa
          </Link>
        </p>
        <h1 className="font-serif text-3xl text-green-950">Przewodnik samorządowy</h1>
        <p className="mt-2 text-sm text-stone-600">Brak przypisanej wsi w roli sołtysa lub współadmina.</p>
      </main>
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
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/soltys" className="text-green-800 underline">
          ← Panel sołtysa
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Przewodnik: gmina, powiat, województwo</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">
        Uzupełnij kontakty i lokalne zasady — na profilu wsi mieszkańcy zobaczą je obok ogólnego skrótu kompetencji
        (nie zastępuje porady prawnej ani aktów urzędowych).
      </p>
      <SoltysSamorzadKlient wsie={wsie} wpisy={wpisy} />
    </main>
  );
}
