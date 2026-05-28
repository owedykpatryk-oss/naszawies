import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzWniosekSoltysaZRejestracji } from "@/lib/soltys/wniosek-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { WniosekSoltysaKlient } from "./wniosek-soltysa-klient";

export const metadata: Metadata = {
  title: "Wniosek — sołtys",
};

export default async function WniosekSoltysaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
    <main className="mx-auto w-full max-w-4xl">
      <p className="text-sm text-stone-500">
        <Link href="/panel" className="text-green-800 underline">
          ← Start panelu
        </Link>
      </p>
      <h1 className="tytul-sekcji-panelu mt-2">Wniosek o rolę sołtysa</h1>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-stone-600">
        Portal zakłada <strong>jednego aktywnego sołtysa na sołectwo</strong>. Po zatwierdzeniu przez administratora
        platformy otrzymasz dostęp do panelu sołtysa i publicznego profilu wsi.
      </p>
      <div className="mt-8">
        <WniosekSoltysaKlient wnioski={wnioski ?? []} maRoleSoltysa={villageIds.length > 0} />
      </div>
    </main>
  );
}
