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
    <div className="panel-tlo min-h-[100dvh] min-w-0 overflow-x-hidden">
      <div className="mx-auto w-full min-w-0 max-w-3xl py-8 sm:py-10 text-stone-800">
        <div className="no-print">
          <PanelNawigacja pokazLinkSoltysa={pokazLinkSoltysa} />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
