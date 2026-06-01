import type { Metadata } from "next";
import Link from "next/link";
import { NaglowekModuluPanelu } from "@/components/pomoc/naglowek-modulu-panelu";
import { pobierzObserwowaneProfileRynku } from "@/lib/marketplace/pobierz-obserwowane-profile";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { FirmyObserwowaneLista } from "./firmy-obserwowane-lista";

export const metadata: Metadata = {
  title: "Obserwowane firmy i sklepy",
};

export default async function MojeObserwowaneFirmyPage() {
  const user = await pobierzUzytkownikaPanelu();
  const supabase = utworzKlientaSupabaseSerwer();

  const profile = await pobierzObserwowaneProfileRynku(supabase, user.id);

  return (
    <main>
      <NaglowekModuluPanelu
        etykieta="Rynek lokalny"
        tytul="Obserwowane firmy i sklepy"
        hrefPowrotu="/panel/moje"
        etykietaPowrotu="← Obserwowane"
        opis="Gdy profil doda nową ofertę na rynku wsi, dostaniesz powiadomienie w panelu (i opcjonalnie push, jeśli masz włączone)."
      />

      {profile.length === 0 ? (
        <div className="panel-karta mt-6 text-sm text-stone-700">
          <p>Nie obserwujesz jeszcze żadnej firmy ani sklepu z rynku lokalnego.</p>
          <p className="mt-3">
            Wejdź na{" "}
            <Link href="/szukaj" className="font-medium text-green-800 underline">
              profil wsi → Rynek
            </Link>
            , wybierz kartę firmy i kliknij <strong>Obserwuj firmę</strong>.
          </p>
          <p className="mt-3">
            Prowadzisz działalność?{" "}
            <Link href="/panel/mieszkaniec/profil-rynek" className="font-medium text-green-800 underline">
              Załóż swój profil sklepu / firmy
            </Link>
            .
          </p>
        </div>
      ) : (
        <FirmyObserwowaneLista profile={profile} />
      )}
    </main>
  );
}
