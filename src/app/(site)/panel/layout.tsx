import { PanelNaglowekZLogo } from "@/components/panel/panel-naglowek-z-logo";
import { czyAdminPlatformy } from "@/lib/admin/czy-admin-platformy";
import { pobierzLiczbeNieprzeczytanychCzatu } from "@/lib/czat/pobierz-nieprzeczytane";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

/** Wymaga sesji — brak prerendera statycznego, żeby hooki miały kontekst żądania. */
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let pokazLinkSoltysa = false;
  let liczbaWiadomosciNieprzeczytanych = 0;
  let pokazAdmin = false;
  if (user) {
    const [wsi, liczbaWiadomosci, admin] = await Promise.all([
      pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id),
      pobierzLiczbeNieprzeczytanychCzatu(supabase, user.id),
      czyAdminPlatformy(supabase),
    ]);
    pokazLinkSoltysa = wsi.length > 0;
    liczbaWiadomosciNieprzeczytanych = liczbaWiadomosci;
    pokazAdmin = admin;
  }

  return (
    <div className="panel-tlo min-h-[100dvh] min-w-0 overflow-x-hidden">
      <div className="panel-shell w-full min-w-0 py-6 text-stone-800 sm:py-8 lg:py-10">
        <div className="no-print">
          <PanelNaglowekZLogo
            pokazLinkSoltysa={pokazLinkSoltysa}
            liczbaWiadomosciNieprzeczytanych={liczbaWiadomosciNieprzeczytanych}
            pokazAdmin={pokazAdmin}
          />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
