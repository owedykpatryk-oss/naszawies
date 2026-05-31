import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PanelStronaModulu } from "@/components/panel/panel-strona-modulu";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzWniosekSoltysaZRejestracji } from "@/lib/soltys/wniosek-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { WniosekSoltysaKlient } from "./wniosek-soltysa-klient";

export const metadata: Metadata = {
  title: "Wniosek — sołtys",
};

export default async function WniosekSoltysaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) redirect("/logowanie?next=/panel/wniosek-soltysa");

  await utworzWniosekSoltysaZRejestracji();

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);

  const { data: wnioski } = await supabase
    .from("soltys_village_applications")
    .select("id, status, village_name, commune, county, voivodeship, created_at, admin_note, reviewed_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <PanelStronaModulu
      etykieta="Panel"
      tytul="Wniosek o rolę sołtysa"
      hrefPowrotu="/panel"
      etykietaPowrotu="← Start panelu"
      opis={
        <>
          Portal zakłada <strong>jednego aktywnego sołtysa na sołectwo</strong>. Po zatwierdzeniu przez administratora
          platformy otrzymasz dostęp do panelu sołtysa i publicznego profilu wsi.
        </>
      }
      dzieci={<WniosekSoltysaKlient wnioski={wnioski ?? []} maRoleSoltysa={villageIds.length > 0} />}
    />
  );
}
