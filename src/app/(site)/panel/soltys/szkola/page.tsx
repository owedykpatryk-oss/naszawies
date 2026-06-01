import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { SzkolaPanelKlient } from "@/components/panel/soltys/szkola-panel-klient";
import { pobierzOgloszeniaSzkolyDlaPanelu } from "@/lib/szkola/pobierz-ogloszenia-szkoly";
import { czyOrganizacjaSzkola } from "@/lib/wies/profil-organizacji";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export const metadata: Metadata = {
  title: "Szkoła — tablica ogłoszeń",
  description: "Zarządzanie tablicą szkoły na profilu wsi.",
};

export default async function PanelSzkolaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/logowanie?next=/panel/soltys/szkola");

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (villageIds.length === 0) redirect("/panel");

  const { data: wiersze } = await supabase
    .from("villages")
    .select("id, name, voivodeship, county, commune, slug")
    .in("id", villageIds);

  const { data: grupy } = await supabase
    .from("village_community_groups")
    .select("id, village_id, name, group_type")
    .in("village_id", villageIds)
    .eq("is_active", true);

  const ogloszeniaPoWsi: Record<string, Awaited<ReturnType<typeof pobierzOgloszeniaSzkolyDlaPanelu>>> = {};
  const grupyPoWsi: Record<string, { id: string; name: string }[]> = {};

  for (const vid of villageIds) {
    ogloszeniaPoWsi[vid] = await pobierzOgloszeniaSzkolyDlaPanelu(supabase, vid, 80);
    grupyPoWsi[vid] = (grupy ?? [])
      .filter((g) => g.village_id === vid && czyOrganizacjaSzkola(g.group_type, g.name))
      .map((g) => ({ id: g.id as string, name: g.name as string }));
  }

  return (
    <PanelStronaSoltysa
      tytul="Szkoła — tablica ogłoszeń"
      opis={
        <>
          Ogłoszenia dla uczniów, rodziców i kadry. Profil szkoły (dyrektor, sekretariat) ustawiasz w{" "}
          <Link href="/panel/soltys/spolecznosc?tryb=szkola" className="font-medium text-green-800 underline">
            Społeczność (tryb szkoły)
          </Link>
          .
        </>
      }
      szeroki
      dzieci={
        <SzkolaPanelKlient wsie={wiersze ?? []} ogloszeniaPoWsi={ogloszeniaPoWsi} grupyPoWsi={grupyPoWsi} />
      }
    />
  );
}
