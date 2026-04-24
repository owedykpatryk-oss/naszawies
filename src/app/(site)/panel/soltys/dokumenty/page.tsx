import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GeneratorDokumentowSoltysaKlient } from "@/components/soltys/generator-dokumentow-klient";
import { PRESETY_DOKUMENTOW_SOLTYSA } from "@/lib/dokumenty-soltysa/presety";
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

  const { data: mojeWsi } = await supabase
    .from("user_village_roles")
    .select("village_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", ["soltys", "wspoladmin"]);

  const villageIds = (mojeWsi ?? []).map((m) => m.village_id).filter(Boolean);
  let domyslnaWies = "";
  let domyslnaGmina = "";
  if (villageIds.length > 0) {
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

      {villageIds.length === 0 ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Nie masz aktywnej roli sołtysa — generator jest dostępny po przypisaniu roli. Szablony nadal możesz
          przeglądać; pola „wies” / „gmina” uzupełnisz ręcznie.
        </p>
      ) : null}

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
