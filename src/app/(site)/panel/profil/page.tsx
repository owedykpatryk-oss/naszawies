import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { ProfilFormularz } from "./profil-formularz";

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

  return (
    <main>
      <h1 className="mb-2 font-serif text-3xl text-green-950">Mój profil</h1>
      <p className="mb-8 text-sm text-stone-600">
        Dane z tabeli <code className="rounded bg-stone-100 px-1 text-xs">public.users</code> — widoczne dla innych zgodnie z polityką RLS (np. nazwa przy aktywnym koncie).
      </p>

      {!profil ? (
        <div className="mb-8 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Nie znaleziono wiersza w <code className="text-xs">public.users</code> (np. konto sprzed triggera). Pierwszy zapis utworzy profil — wymagana jest migracja z polityką INSERT dla własnego{" "}
          <code className="text-xs">id</code>.
        </div>
      ) : (
        <p className="mb-6 text-xs text-stone-500">
          Status konta: <strong>{profil.account_status}</strong>
        </p>
      )}

      <ProfilFormularz poczatkowe={poczatkowe} />
    </main>
  );
}
