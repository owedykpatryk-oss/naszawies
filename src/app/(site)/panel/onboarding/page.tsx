import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoNaszawiesWycentrowane } from "@/components/marka/logo-naszawies";
import { bezpiecznaSciezkaNastepna } from "@/lib/auth/bezpieczna-sciezka-nastepna";
import { czyUzytkownikUknczylOnboarding } from "@/lib/auth/onboarding-uzytkownika";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzWiesPoIdDlaRejestracji } from "@/app/(site)/rejestracja/akcje-katalog-wsi";
import { OnboardingKlient } from "./onboarding-klient";
import type { IntencjaOnboardingu } from "@/lib/auth/onboarding-uzytkownika";

export const metadata: Metadata = {
  title: "Wybór wsi i roli",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function PanelOnboardingPage({ searchParams }: Props) {
  const user = await pobierzUzytkownikaSerwer();
  if (!user) {
    redirect("/logowanie?next=/panel/onboarding");
  }

  const supabase = utworzKlientaSupabaseSerwer();
  const ukonczony = await czyUzytkownikUknczylOnboarding(supabase, user);
  const nextParam = searchParams.next;
  const nastepna = typeof nextParam === "string" ? bezpiecznaSciezkaNastepna(nextParam) : "/panel";

  if (ukonczony) {
    redirect(nastepna);
  }

  const { data: profil } = await supabase.from("users").select("display_name").eq("id", user.id).maybeSingle();
  const meta = user.user_metadata ?? {};
  const domyslnaNazwa =
    (profil?.display_name ?? "").trim() ||
    (typeof meta.display_name === "string" ? meta.display_name.trim() : "") ||
    user.email?.split("@")[0] ||
    "";

  const villageIdRaw =
    typeof meta.signup_village_id === "string" ? meta.signup_village_id.trim() : "";
  const domyslnaWies = villageIdRaw ? await pobierzWiesPoIdDlaRejestracji(villageIdRaw) : null;
  const intentRaw = typeof meta.signup_intent === "string" ? meta.signup_intent : "";
  const domyslnaIntencja: IntencjaOnboardingu | undefined =
    intentRaw === "mieszkaniec" || intentRaw === "soltys" || intentRaw === "przegladam"
      ? intentRaw
      : domyslnaWies
        ? "mieszkaniec"
        : undefined;

  return (
    <main className="mx-auto w-full max-w-7xl py-4">
      <LogoNaszawiesWycentrowane />
      <p className="mb-4 mt-4 text-center text-sm text-stone-600">
        <Link href="/wyloguj" className="font-medium text-green-800 underline">
          Wyloguj
        </Link>
        {" · "}
        inne konto? Wyloguj się i zaloguj właściwym adresem.
      </p>
      <OnboardingKlient
        nastepnaSciezka={nastepna}
        domyslnaNazwa={domyslnaNazwa}
        email={user.email ?? ""}
        domyslnaIntencja={domyslnaIntencja}
        domyslnaWies={domyslnaWies}
      />
    </main>
  );
}
