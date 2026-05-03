import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { ProfilFormularz } from "./profil-formularz";
import { ProfilSekcjaRodo } from "./profil-sekcja-rodo";

export const metadata: Metadata = {
  title: "Mój profil",
  description: "Edycja profilu użytkownika w naszawies.pl.",
};

export default async function PanelProfilPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/logowanie?next=/panel/profil");
  }

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

  return (
    <main>
      {!nickStartuOk ? (
        <div className="mb-6 rounded-xl border border-amber-300/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm">
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
      <h1 className="mb-2 font-serif text-3xl text-green-950">Mój profil</h1>
      <p className="mb-8 text-sm text-stone-600">
        Te dane widać u innych użytkowników zgodnie z ustawieniami i polityką prywatności.
      </p>

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

      <ProfilSekcjaRodo />
    </main>
  );
}
