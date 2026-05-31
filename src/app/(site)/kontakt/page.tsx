import type { Metadata } from "next";
import Link from "next/link";
import { HeroModuluPublicznego } from "@/components/wspolne/hero-modulu-publicznego";
import { KontaktFormularz } from "./kontakt-formularz";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Adresy e-mail naszawies.pl oraz formularz kontaktowy. RODO, moderacja, DSA.",
};

export default function KontaktPage() {
  return (
    <main className="page-shell max-w-4xl py-8 sm:py-12">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="font-medium text-green-800 underline decoration-emerald-600/40 underline-offset-2">
          ← Strona główna
        </Link>
      </p>

      <HeroModuluPublicznego
        etykieta="Napisz do nas"
        tytul="Kontakt"
        opis="Adresy e-mail zespołu naszawies.pl — RODO, moderacja treści i punkt kontaktowy DSA. Formularz poniżej, gdy wolisz wysłać wiadomość z przeglądarki."
      />

      <ul className="panel-karta mt-8 list-inside list-disc space-y-2 leading-relaxed text-stone-700">
        <li>
          Ogólne:{" "}
          <a className="font-medium text-green-800 underline" href="mailto:kontakt@naszawies.pl">
            kontakt@naszawies.pl
          </a>
        </li>
        <li>
          RODO:{" "}
          <a className="font-medium text-green-800 underline" href="mailto:rodo@naszawies.pl">
            rodo@naszawies.pl
          </a>
        </li>
        <li>
          Moderacja treści:{" "}
          <a className="font-medium text-green-800 underline" href="mailto:moderacja@naszawies.pl">
            moderacja@naszawies.pl
          </a>
        </li>
        <li>
          Punkt kontaktowy DSA:{" "}
          <a className="font-medium text-green-800 underline" href="mailto:dsa@naszawies.pl">
            dsa@naszawies.pl
          </a>
        </li>
      </ul>

      <div className="mt-8">
        <KontaktFormularz />
      </div>
    </main>
  );
}
