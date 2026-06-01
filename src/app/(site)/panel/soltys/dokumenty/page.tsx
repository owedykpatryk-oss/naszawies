import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { GeneratorDokumentowSoltysaKlient } from "@/components/soltys/generator-dokumentow-klient";
import { PRESETY_DOKUMENTOW_SOLTYSA } from "@/lib/dokumenty-soltysa/presety";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";

export const metadata: Metadata = {
  title: "Generator dokumentów",
};

export default async function SoltysDokumentyPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaPanelu();

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);

  if (villageIds.length === 0) {
    return (
      <PanelStronaSoltysa
        tytul="Generator dokumentów"
        dzieci={
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-medium">Brak uprawnień do generatora</p>
          <p className="mt-2 leading-relaxed">
            Szablony i eksport PDF są dostępne tylko dla użytkowników z aktywną rolą sołtysa albo współadministratora
            wsi.
          </p>
          <p className="mt-3">
            <Link href="/panel/soltys" className="link-panel">
              Panel sołtysa
            </Link>
          </p>
        </div>
        }
      />
    );
  }

  const { data: wsieRows } = await supabase
    .from("villages")
    .select("id, name, commune")
    .in("id", villageIds)
    .order("name");

  const wsie = (wsieRows ?? []).map((v) => ({
    id: v.id,
    name: v.name ?? "",
    commune: v.commune ?? "",
  }));

  const pierwsza = wsie[0];
  const { data: profilUzytkownika } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const domyslnySoltysNazwa = profilUzytkownika?.display_name?.trim() ?? "";

  return (
    <PanelStronaSoltysa
      szeroki
      tytul="Generator dokumentów"
      opis={
        <>
          {PRESETY_DOKUMENTOW_SOLTYSA.length} gotowych szablonów (zebrania, fundusz sołecki, sponsorzy, pisma do gminy,
          KGW, OSP). U góry: <strong>scenariusze 1‑klik</strong> i <strong>lejek sponsora</strong>. Pola zapisują się
          automatycznie w przeglądarce — możesz wrócić do szkicu później. Eksport: <strong>Pobierz PDF</strong> lub
          druk systemowy.
        </>
      }
      dzieci={
        <Suspense fallback={<p className="text-sm text-stone-600">Ładowanie generatora…</p>}>
          <GeneratorDokumentowSoltysaKlient
            wsie={wsie}
            domyslnaWies={pierwsza?.name ?? ""}
            domyslnaGmina={pierwsza?.commune ?? ""}
            domyslnySoltysNazwa={domyslnySoltysNazwa}
          />
        </Suspense>
      }
    />
  );
}
