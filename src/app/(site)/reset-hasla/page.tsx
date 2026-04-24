import type { Metadata } from "next";
import Link from "next/link";
import { pobierzPochodzeniePubliczne } from "@/lib/zadanie/pochodzenie-publiczne";
import { ResetHaslaFormularz } from "./reset-hasla-formularz";

export const metadata: Metadata = {
  title: "Reset hasła",
  description: "Odzyskiwanie dostępu do konta naszawies.pl.",
};

export default function ResetHaslaPage() {
  const pochodzenie = pobierzPochodzeniePubliczne();

  return (
    <main className="mx-auto min-w-0 max-w-md py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/logowanie" className="text-green-800 underline">
          ← Logowanie
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Reset hasła</h1>
      <p className="mt-2 text-sm text-stone-600">
        Podaj adres e-mail konta — wyślemy link z instrukcją do ustawienia nowego hasła.
      </p>
      <ResetHaslaFormularz pochodzeniePubliczne={pochodzenie} />
    </main>
  );
}
