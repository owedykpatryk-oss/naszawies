"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";

type Props = {
  /** Pełny URL, np. https://naszawies.pl — do linku w e-mailu Supabase */
  pochodzeniePubliczne: string;
};

export function RejestracjaFormularz({ pochodzeniePubliczne }: Props) {
  const [laduje, ustawLaduje] = useState(false);
  const [blad, ustawBlad] = useState("");
  const [sukces, ustawSukces] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") || "").trim();
    const haslo = String(fd.get("haslo") || "");
    const haslo2 = String(fd.get("haslo2") || "");
    const wyswietlanaNazwa = String(fd.get("wyswietlana_nazwa") || "").trim();

    ustawBlad("");
    if (haslo !== haslo2) {
      ustawBlad("Hasła muszą być takie same.");
      return;
    }
    if (haslo.length < 8) {
      ustawBlad("Hasło powinno mieć co najmniej 8 znaków.");
      return;
    }

    ustawLaduje(true);
    try {
      const supabase = utworzKlientaSupabasePrzegladarka();
      const { error } = await supabase.auth.signUp({
        email,
        password: haslo,
        options: {
          emailRedirectTo: `${pochodzeniePubliczne}/auth/potwierdz`,
          data: {
            display_name: wyswietlanaNazwa || email.split("@")[0] || "Użytkownik",
          },
        },
      });
      if (error) {
        ustawBlad(
          error.message.includes("already registered")
            ? "Ten adres jest już zarejestrowany — spróbuj się zalogować."
            : error.message
        );
        return;
      }
      ustawSukces(true);
      form.reset();
    } catch {
      ustawBlad("Nie udało się połączyć z serwerem.");
    } finally {
      ustawLaduje(false);
    }
  }

  if (sukces) {
    return (
      <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 text-center text-stone-800">
        <p className="font-medium text-green-900">Sprawdź skrzynkę e-mail</p>
        <p className="mt-2 text-sm leading-relaxed">
          Wysłaliśmy wiadomość z linkiem potwierdzającym. Po kliknięciu zostaniesz przekierowany i
          zalogowany.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/logowanie" className="text-green-800 underline">
            Wróć do logowania
          </Link>
        </p>
      </div>
    );
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
        <label htmlFor="reg-nazwa" className="mb-1 block text-sm font-medium text-stone-700">
          Wyświetlana nazwa
        </label>
        <input
          id="reg-nazwa"
          name="wyswietlana_nazwa"
          type="text"
          required
          minLength={2}
          maxLength={80}
          autoComplete="nickname"
          placeholder="np. Jan lub Sołtys Arcelin"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="reg-email" className="mb-1 block text-sm font-medium text-stone-700">
          E-mail
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="reg-haslo" className="mb-1 block text-sm font-medium text-stone-700">
          Hasło
        </label>
        <input
          id="reg-haslo"
          name="haslo"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="reg-haslo2" className="mb-1 block text-sm font-medium text-stone-700">
          Powtórz hasło
        </label>
        <input
          id="reg-haslo2"
          name="haslo2"
          type="password"
          required
          autoComplete="new-password"
          minLength={8}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
        />
      </div>
      <button
        type="submit"
        disabled={laduje}
        className="w-full rounded-lg bg-green-800 px-4 py-2.5 font-medium text-white transition hover:bg-green-900 disabled:opacity-60"
      >
        {laduje ? "Wysyłanie…" : "Zarejestruj się"}
      </button>
      <p className="text-center text-sm text-stone-600">
        Masz już konto?{" "}
        <Link href="/logowanie" className="text-green-800 underline">
          Zaloguj się
        </Link>
      </p>
    </form>
  );
}
