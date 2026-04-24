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
    <main className="mx-auto max-w-md px-5 py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Rejestracja</h1>
      <p className="mt-2 text-sm text-stone-600">
        Konto przez Google / GitHub od razu działa. Rejestracja e-mailem wymaga potwierdzenia
        skrzynki. Wybór roli we wsi — w kolejnych krokach roadmapy.
      </p>
      <LogowanieProwiderzy pochodzeniePubliczne={pochodzenie} nastepnaSciezka="/panel" />
      <p className="mt-8 text-center text-sm text-stone-500">lub zarejestruj się e-mailem</p>
      <RejestracjaFormularz pochodzeniePubliczne={pochodzenie} />
    </main>
  );
}
