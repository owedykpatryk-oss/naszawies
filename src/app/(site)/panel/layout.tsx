import { PanelNawigacja } from "@/components/panel/panel-nawigacja";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

/** Wymaga sesji / zmiennych Supabase — nie prerenderuj statycznie na buildzie (np. Vercel bez pełnego env). */
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let pokazLinkSoltysa = false;
  if (user) {
    const wsi = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
    pokazLinkSoltysa = wsi.length > 0;
  }

  return (
    <div className="panel-tlo min-w-0 overflow-x-hidden">
      <div className="mx-auto w-full min-w-0 max-w-3xl px-4 py-8 text-stone-800 sm:px-5 sm:py-10">
        <div className="no-print">
          <PanelNawigacja pokazLinkSoltysa={pokazLinkSoltysa} />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
