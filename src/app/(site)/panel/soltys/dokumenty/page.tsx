import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GeneratorDokumentowSoltysaKlient } from "@/components/soltys/generator-dokumentow-klient";
import { PRESETY_DOKUMENTOW_SOLTYSA } from "@/lib/dokumenty-soltysa/presety";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export const metadata: Metadata = {
  title: "Generator dokumentów",
};

export default async function SoltysDokumentyPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/dokumenty");
  }

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);

  if (villageIds.length === 0) {
    return (
      <main>
        <p className="mb-4 text-sm text-stone-500">
          <Link href="/panel/soltys" className="text-green-800 underline">
            ← Panel sołtysa
          </Link>
        </p>
        <h1 className="font-serif text-3xl text-green-950">Generator dokumentów</h1>
        <div className="mt-6 max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p className="font-medium">Brak uprawnień do generatora</p>
          <p className="mt-2 leading-relaxed">
            Szablony i eksport PDF są dostępne tylko dla użytkowników z{" "}
            <strong>aktywną rolą sołtysa albo współadministratora wsi</strong> (zgodnie z uprawnieniami w
            systemie). Zalogowanie bez tej roli — tak jak konto mieszkańca —{" "}
            <strong>nie wystarcza</strong>.
          </p>
          <p className="mt-3 leading-relaxed">
            Jeśli prowadzisz sołectwo: po nadaniu roli sołtysa wróć tutaj z{" "}
            <Link href="/panel/soltys" className="text-green-900 underline">
              panelu sołtysa
            </Link>
            . W innych przypadkach skorzystaj z{" "}
            <Link href="/panel/mieszkaniec" className="text-green-900 underline">
              panelu mieszkańca
            </Link>{" "}
            (wniosek o akceptację we wsi).
          </p>
        </div>
      </main>
    );
  }

  let domyslnaWies = "";
  let domyslnaGmina = "";
  {
    const { data: v } = await supabase
      .from("villages")
      .select("name, commune")
      .eq("id", villageIds[0])
      .maybeSingle();
    if (v) {
      domyslnaWies = v.name ?? "";
      domyslnaGmina = v.commune ?? "";
    }
  }

  const { data: profilUzytkownika } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const domyslnySoltysNazwa = profilUzytkownika?.display_name?.trim() ?? "";

  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/soltys" className="text-green-800 underline">
          ← Panel sołtysa
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Generator dokumentów</h1>
      <p className="mt-2 max-w-3xl text-sm text-stone-600">
        {PRESETY_DOKUMENTOW_SOLTYSA.length} gotowych szablonów (zebrania, fundusz sołecki, pisma do gminy, potwierdzenia
        wpływu, świetlica, pełnomocnictwa, RODO i in.). Wieś, gmina i podpis mogą wypełnić się z panelu; uzupełnij
        resztę, sprawdź podgląd — przycisk „Pobierz PDF” zapisuje plik (także na telefonie); „Drukuj / PDF z systemu”
        korzysta z okna drukowania przeglądarki.
      </p>

      <div className="mt-10">
        <GeneratorDokumentowSoltysaKlient
          domyslnaWies={domyslnaWies}
          domyslnaGmina={domyslnaGmina}
          domyslnySoltysNazwa={domyslnySoltysNazwa}
        />
      </div>
    </main>
  );
}
