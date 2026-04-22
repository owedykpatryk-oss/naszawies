import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kontakt",
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="mb-6 font-serif text-3xl text-green-950">Kontakt</h1>
      <ul className="list-inside list-disc space-y-2 leading-relaxed">
        <li>
          Ogólne:{" "}
          <a className="text-green-800 underline" href="mailto:kontakt@naszawies.pl">
            kontakt@naszawies.pl
          </a>
        </li>
        <li>
          RODO:{" "}
          <a className="text-green-800 underline" href="mailto:rodo@naszawies.pl">
            rodo@naszawies.pl
          </a>
        </li>
        <li>
          Moderacja treści:{" "}
          <a
            className="text-green-800 underline"
            href="mailto:moderacja@naszawies.pl"
          >
            moderacja@naszawies.pl
          </a>
        </li>
        <li>
          Punkt kontaktowy DSA:{" "}
          <a className="text-green-800 underline" href="mailto:dsa@naszawies.pl">
            dsa@naszawies.pl
          </a>
        </li>
      </ul>
    </main>
  );
}
