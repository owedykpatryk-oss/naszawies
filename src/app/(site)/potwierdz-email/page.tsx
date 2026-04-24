import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Potwierdzenie e-mail",
  description: "Informacje o potwierdzaniu adresu e-mail po rejestracji.",
};

export default function PotwierdzEmailPage() {
  return (
    <main className="mx-auto min-w-0 max-w-lg py-16 text-stone-800">
      <p className="mb-6 text-sm text-stone-500">
        <Link href="/" className="text-green-800 underline">
          ← Strona główna
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Potwierdzenie adresu e-mail</h1>
      <p className="mt-4 leading-relaxed text-stone-700">
        Po rejestracji wysyłamy wiadomość z linkiem.{" "}
        <strong>Kliknięcie w link</strong> otwiera adres{" "}
        <code className="rounded bg-stone-100 px-1 text-sm">/auth/potwierdz</code>, który loguje Cię
        na stronie i przekierowuje do panelu.
      </p>
      <p className="mt-4 text-sm text-stone-600">
        W panelu Supabase dodaj do <strong>Redirect URLs</strong> m.in.:{" "}
        <code className="break-all rounded bg-stone-100 px-1 text-xs">
          https://twoja-domena.pl/auth/potwierdz
        </code>{" "}
        oraz <code className="rounded bg-stone-100 px-1 text-xs">http://localhost:3000/auth/potwierdz</code>{" "}
        (na czas pracy lokalnej).
      </p>
      <p className="mt-8 text-sm">
        <Link href="/logowanie" className="text-green-800 underline">
          Przejdź do logowania
        </Link>
      </p>
    </main>
  );
}
