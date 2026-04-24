import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Potwierdzenie e-mail",
  description: "Potwierdzanie adresu e-mail po rejestracji w naszawies.pl.",
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
        Po rejestracji wysyłamy wiadomość z linkiem. <strong>Kliknij w link w mailu</strong>, żeby potwierdzić
        adres i wejść do serwisu — zostaniesz przekierowany do panelu.
      </p>
      <p className="mt-4 text-sm leading-relaxed text-stone-600">
        Nie widzisz wiadomości? Sprawdź folder z niechcianą pocztą i upewnij się, że podałaś / podałeś poprawny
        adres.
      </p>
      <p className="mt-8 text-sm">
        <Link href="/logowanie" className="text-green-800 underline">
          Przejdź do logowania
        </Link>
      </p>
    </main>
  );
}
