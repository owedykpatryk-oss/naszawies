import type { Metadata } from "next";
import Link from "next/link";

import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { NaglowekModuluPanelu } from "@/components/pomoc/naglowek-modulu-panelu";
import { ProfilFormularz } from "./profil-formularz";
import { ProfilSekcjaRodo } from "./profil-sekcja-rodo";
import { ProfilPreferencjeNawigacjiKlient } from "./profil-preferencje-nawigacji-klient";
import { pobierzKluczeDolnejNawigacjiZMeta, pobierzKluczePanelNawigacjiZMeta } from "@/lib/uzytkownik/preferencje-ui";
import { ProfilPreferencjePanelKlient } from "./profil-preferencje-panel-klient";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { czyAdminPlatformy } from "@/lib/admin/czy-admin-platformy";
import { PrzelacznikTrybuSeniora, PrzelacznikKontrastu } from "@/components/ui/tryb-senior-provider";
import { ProfilPowiazanieWsiKlient } from "./profil-powiazanie-wsi-klient";
import { pobierzMojePowiazania } from "@/lib/panel/pobierz-moje-powiazania";
import type { IntencjaOnboardingu } from "@/lib/auth/onboarding-uzytkownika";

export const metadata: Metadata = {
  title: "Mój profil",
  description: "Edycja profilu użytkownika w naszawies.pl.",
};

export default async function PanelProfilPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaPanelu();

  const { data: profil, error } = await supabase
    .from("users")
    .select("display_name, bio, avatar_url, phone, phone_visible_public, account_status")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[panel/profil]", error.message);
  }

  const poczatkowe = {
    user_id: user.id,
    display_name: profil?.display_name ?? user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "",
    bio: profil?.bio ?? "",
    avatar_url: profil?.avatar_url ?? "",
    phone: profil?.phone ?? "",
    phone_visible_public: Boolean(profil?.phone_visible_public),
  };

  const nickStartuOk = (profil?.display_name ?? poczatkowe.display_name).trim().length >= 2;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const intencjaStart =
    typeof meta.signup_intent === "string" &&
    (meta.signup_intent === "mieszkaniec" || meta.signup_intent === "soltys" || meta.signup_intent === "przegladam")
      ? (meta.signup_intent as IntencjaOnboardingu)
      : null;
  const etykietaWsiStart =
    typeof meta.signup_village_label === "string" && meta.signup_village_label.trim()
      ? meta.signup_village_label.trim()
      : null;

  const powiazania = await pobierzMojePowiazania(user);
  const wszystkieWsi = powiazania?.powiaty.flatMap((po) => po.gminy.flatMap((g) => g.wies)) ?? [];
  const metaUser = user.user_metadata as Record<string, unknown>;
  const kluczeDolnejNaw = pobierzKluczeDolnejNawigacjiZMeta(metaUser, true);
  const [villageIdsSoltys, pokazAdmin] = await Promise.all([
    pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id),
    czyAdminPlatformy(supabase),
  ]);
  const kluczePanelu = pobierzKluczePanelNawigacjiZMeta(metaUser, {
    pokazSoltysa: villageIdsSoltys.length > 0,
    pokazAdmin,
  });

  return (
    <main>
      {!nickStartuOk ? (
        <div className="baner-wskazowka baner-wskazowka--zielony mb-6 border-amber-300/80 bg-amber-50/90 text-amber-950">
          <p className="font-medium text-amber-950">Uzupełnij nazwę wyświetlaną (min. 2 znaki)</p>
          <p className="mt-1 text-amber-900/95">
            To pierwszy krok przewodnika po zalogowaniu — inni użytkownicy zobaczą Cię pod tą nazwą w wiosce i w
            powiadomieniach.{" "}
            <Link href="/panel/pierwsze-kroki#krok-profil" className="font-medium text-green-900 underline">
              Jak to działa — pierwsze kroki
            </Link>
            .
          </p>
        </div>
      ) : null}
      <NaglowekModuluPanelu
        etykieta="Konto"
        tytul="Mój profil"
        hrefPowrotu="/panel"
        etykietaPowrotu="← Panel"
        opis="Te dane widać u innych użytkowników zgodnie z ustawieniami i polityką prywatności."
      />

      {!profil ? (
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Nie udało się wczytać profilu. Spróbuj odświeżyć stronę. Gdy problem się powtórzy, napisz na adres kontaktowy
          serwisu.
        </div>
      ) : (
        <p className="mb-6 text-xs text-stone-500">
          Status konta: <strong>{profil.account_status}</strong>
        </p>
      )}

      <ProfilFormularz poczatkowe={poczatkowe} />

      <ProfilPreferencjeNawigacjiKlient zalogowany poczatkowe={kluczeDolnejNaw} />

      <ProfilPreferencjePanelKlient
        poczatkowe={kluczePanelu}
        pokazSoltysa={villageIdsSoltys.length > 0}
        pokazAdmin={pokazAdmin}
      />

      <section className="my-8 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="font-serif text-lg text-green-950">Dostępność</h2>
        <p className="mt-1 text-sm text-stone-600">Większy tekst i wysoki kontrast — także na profilu publicznym wsi.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <PrzelacznikTrybuSeniora />
          <PrzelacznikKontrastu />
        </div>
      </section>

      <ProfilPowiazanieWsiKlient
        intencjaStart={intencjaStart}
        etykietaWsiStart={etykietaWsiStart}
        powiazania={wszystkieWsi}
      />

      <ProfilSekcjaRodo />
    </main>
  );
}
