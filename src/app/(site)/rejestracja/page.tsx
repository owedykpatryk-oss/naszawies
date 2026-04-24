import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzPochodzeniePubliczne } from "@/lib/zadanie/pochodzenie-publiczne";
import { LogowanieProwiderzy } from "../logowanie/logowanie-prowiderzy";
import { RejestracjaFormularz } from "./rejestracja-formularz";

export const metadata: Metadata = {
  title: "Rejestracja",
  description: "Załóż konto na naszawies.pl.",
};

export default async function RejestracjaPage() {
  const pochodzenie = pobierzPochodzeniePubliczne();

  try {
    const supabase = utworzKlientaSupabaseSerwer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/panel");
    }
  } catch {
    // brak env — strona dalej pokaże formularz
  }

  return (
    <main className="mx-auto min-w-0 max-w-md py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Rejestracja</h1>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">
        <strong>To samo konto</strong> dla każdego: mieszkaniec, sołtys i inne role to osobny krok{" "}
        <em>po</em> założeniu konta (wniosek do wsi, akceptacja sołtysa, ewentualnie zespół
        naszawies.pl przy roli sołtysa). Tutaj tylko zakładasz logowanie — bez wyboru „jestem
        sołtysem” w sensie prawnym.
      </p>
      <aside className="mt-4 rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-xs leading-relaxed text-amber-950">
        <strong>Potwierdzenie e-mailem:</strong> wiadomość wysyła <strong>Supabase</strong> (nie skrzynka
        „kontakt”). Sprawdź <strong>spam / Oferty</strong>. Jeśli nic nie przyszło po kilkunastu minutach,
        administrator sprawdza w Supabase → Authentication → <strong>Users</strong> (czy konto jest) oraz
        <strong> Logs</strong> — i czy w Vercel jest ustawione{" "}
        <code className="rounded bg-white/80 px-1">NEXT_PUBLIC_SITE_URL</code> zgodne z domeną (patrz{" "}
        <code className="rounded bg-white/80 px-1">docs/POLACZENIE.md</code>). Gdy w projekcie wyłączone
        jest potwierdzanie e-maila — można od razu próbować <Link href="/logowanie" className="underline">logowania</Link>.
      </aside>
      <LogowanieProwiderzy pochodzeniePubliczne={pochodzenie} nastepnaSciezka="/panel" />
      <p className="mt-8 text-center text-sm text-stone-500">lub zarejestruj się e-mailem</p>
      <RejestracjaFormularz pochodzeniePubliczne={pochodzenie} />
    </main>
  );
}
