import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sciezkaKreatoraGrafikiDlaUzytkownika } from "@/lib/grafika/sciezka-kreatora";
import { ponowJesliRedirect } from "@/lib/next/ponow-redirect";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export const metadata: Metadata = {
  title: "Kreator plakatów i zaproszeń",
  description: "Kreator plakatów dla wsi — dostępny po zalogowaniu w panelu.",
};

export default async function GrafikaPublicznaPage() {
  let docelowaSciezka = "/panel/mieszkaniec/grafika";

  try {
    const supabase = utworzKlientaSupabaseSerwer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      docelowaSciezka = await sciezkaKreatoraGrafikiDlaUzytkownika(supabase, user.id);
      redirect(docelowaSciezka);
    }
  } catch (error) {
    ponowJesliRedirect(error);
    /* brak env Supabase — pokaż stronę logowania poniżej */
  }

  return (
    <main className="mx-auto min-w-0 max-w-lg px-4 py-12 text-stone-800 sm:py-16">
      <h1 className="font-serif text-2xl text-green-950">Kreator plakatów</h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-600">
        Szablony zaproszeń, plakatów i dyplomów są dostępne po{" "}
        <Link href="/logowanie?next=/grafika" className="font-medium text-green-800 underline">
          zalogowaniu
        </Link>
        . Sołtys i mieszkaniec z aktywną rolą we wsi mają pełną bibliotekę w panelu.
      </p>
      <p className="mt-6 flex flex-wrap gap-3 text-sm">
        <Link
          href="/logowanie?next=/grafika"
          className="rounded-lg bg-green-800 px-4 py-2 font-medium text-white hover:bg-green-900"
        >
          Zaloguj się
        </Link>
        <Link href="/rejestracja?next=/grafika" className="rounded-lg border border-stone-300 px-4 py-2 hover:bg-stone-50">
          Załóż konto
        </Link>
      </p>
    </main>
  );
}
