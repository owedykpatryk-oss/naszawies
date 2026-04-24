"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";

type Props = {
  nastepnaSciezka: string;
  kodBledu?: string;
  szczegolBledu?: string;
};

const OPISY_BLEDOW: Record<string, string> = {
  "potwierdz-email": "Link potwierdzający wygasł lub jest nieprawidłowy. Spróbuj zalogować się lub zarejestrować ponownie.",
  "sesja-zewnetrzna": "Nie udało się dokończyć logowania (Google / GitHub). Spróbuj ponownie.",
  konfiguracja: "Brak konfiguracji Supabase po stronie serwera.",
};

export function LogowanieFormularz({ nastepnaSciezka, kodBledu, szczegolBledu }: Props) {
  const router = useRouter();
  const [laduje, ustawLaduje] = useState(false);
  const [blad, ustawBlad] = useState(() => {
    if (!kodBledu) return "";
    const podstawa = OPISY_BLEDOW[kodBledu] ?? "Wystąpił problem z logowaniem.";
    if (kodBledu === "sesja-zewnetrzna" && szczegolBledu) {
      return `${podstawa} (${szczegolBledu})`;
    }
    return podstawa;
  });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const haslo = String(fd.get("haslo") || "");
    ustawLaduje(true);
    ustawBlad("");

    try {
      const supabase = utworzKlientaSupabasePrzegladarka();
      const { error } = await supabase.auth.signInWithPassword({ email, password: haslo });
      if (error) {
        ustawBlad(error.message === "Invalid login credentials" ? "Nieprawidłowy e-mail lub hasło." : error.message);
        return;
      }
      router.push(nastepnaSciezka.startsWith("/") ? nastepnaSciezka : "/panel");
      router.refresh();
    } catch {
      ustawBlad("Nie udało się połączyć z serwerem.");
    } finally {
      ustawLaduje(false);
    }
  }

  return (
    <form
      className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      onSubmit={onSubmit}
    >
      {blad ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <div>
        <label htmlFor="log-email" className="mb-1 block text-sm font-medium text-stone-700">
          E-mail
        </label>
        <input
          id="log-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="log-haslo" className="mb-1 block text-sm font-medium text-stone-700">
          Hasło
        </label>
        <input
          id="log-haslo"
          name="haslo"
          type="password"
          required
          autoComplete="current-password"
          minLength={6}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
        />
      </div>
      <button
        type="submit"
        disabled={laduje}
        className="w-full rounded-lg bg-green-800 px-4 py-2.5 font-medium text-white transition hover:bg-green-900 disabled:opacity-60"
      >
        {laduje ? "Logowanie…" : "Zaloguj się"}
      </button>
      <p className="text-center text-sm text-stone-600">
        <Link href="/rejestracja" className="text-green-800 underline">
          Załóż konto
        </Link>
        {" · "}
        <Link href="/reset-hasla" className="text-green-800 underline">
          Nie pamiętasz hasła?
        </Link>
      </p>
    </form>
  );
}
