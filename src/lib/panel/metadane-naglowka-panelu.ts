import { unstable_cache } from "next/cache";
import { czyAdminPlatformy } from "@/lib/admin/czy-admin-platformy";
import { pobierzLiczbeNieprzeczytanychCzatu } from "@/lib/czat/pobierz-nieprzeczytane";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export type MetadaneNaglowkaPanelu = {
  pokazLinkSoltysa: boolean;
  liczbaWiadomosciNieprzeczytanych: number;
  pokazAdmin: boolean;
};

async function pobierzMetadaneNaglowkaPanelu(userId: string): Promise<MetadaneNaglowkaPanelu> {
  const supabase = utworzKlientaSupabaseSerwer();
  const [wsi, liczbaWiadomosci, admin] = await Promise.all([
    pobierzVillageIdsRoliPaneluSoltysa(supabase, userId),
    pobierzLiczbeNieprzeczytanychCzatu(supabase, userId),
    czyAdminPlatformy(supabase),
  ]);
  return {
    pokazLinkSoltysa: wsi.length > 0,
    liczbaWiadomosciNieprzeczytanych: liczbaWiadomosci,
    pokazAdmin: admin,
  };
}

/** Badge’e nagłówka panelu — krótki cache, żeby nawigacja między zakładkami nie robiła 3 zapytań za każdym razem. */
export function pobierzMetadaneNaglowkaPaneluCache(userId: string): Promise<MetadaneNaglowkaPanelu> {
  return unstable_cache(
    () => pobierzMetadaneNaglowkaPanelu(userId),
    ["panel-naglowek", userId],
    { revalidate: 30 },
  )();
}
