import { cache } from "react";
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

/** Badge’e nagłówka panelu — deduplikacja w ramach jednego żądania (wymaga cookies / sesji). */
export const pobierzMetadaneNaglowkaPaneluCache = cache(pobierzMetadaneNaglowkaPanelu);
