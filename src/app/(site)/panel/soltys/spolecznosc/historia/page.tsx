import type { Metadata } from "next";
import Link from "next/link";
import { HistoriaPanelKlient } from "@/components/panel/soltys/historia-panel-klient";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { pobierzHistoriePaneluWsi } from "@/lib/historia/pobierz-historie-wsi";
import { pobierzVillageIdsRoliPaneluSoltysa } from "@/lib/panel/rola-panelu-soltysa";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Kronika wsi — treści publiczne",
  description: "Wpisy historii widoczne na profilu wsi (zakładka Historia).",
};

export default async function SpolecznoscHistoriaPage() {
  const user = await pobierzUzytkownikaPanelu();
  const supabase = utworzKlientaSupabaseSerwer();

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysa(supabase, user.id);
  if (villageIds.length === 0) redirect("/panel");

  const { data: wiersze } = await supabase
    .from("villages")
    .select("id, name, voivodeship, county, commune, slug")
    .in("id", villageIds);

  const wpisyPoWsi: Record<string, Awaited<ReturnType<typeof pobierzHistoriePaneluWsi>>> = {};
  for (const vid of villageIds) {
    wpisyPoWsi[vid] = await pobierzHistoriePaneluWsi(supabase, vid);
  }

  return (
    <PanelStronaSoltysa
      tytul="Kronika wsi (treść publiczna)"
      opis={
        <>
          To nie jest moduł zgłoszeń ani świetlicy — tutaj dodajesz materiały na{" "}
          <strong>publiczną zakładkę Historia</strong> profilu wsi (widoczną dla wszystkich).
          Sprawy operacyjne (usterki, wnioski mieszkańców) obsługujesz w{" "}
          <Link href="/panel/soltys/zgloszenia" className="font-medium text-green-800 underline">
            Zgłoszeniach
          </Link>
          , organizacje i świetlicę — w sekcjach{" "}
          <Link href="/panel/soltys/spolecznosc" className="font-medium text-green-800 underline">
            Społeczność
          </Link>{" "}
          i{" "}
          <Link href="/panel/soltys/swietlica" className="font-medium text-green-800 underline">
            Świetlica
          </Link>
          .
        </>
      }
      szeroki
      dzieci={<HistoriaPanelKlient wsie={wiersze ?? []} wpisyPoWsi={wpisyPoWsi} />}
    />
  );
}
