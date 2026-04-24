"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { czyPelneImieINazwisko } from "@/lib/rejestracja/validate-imie-soltysa";
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
    const intencja = String(fd.get("intencja_rejestracji") || "").trim();
    const intencjaDoMetadanych =
      intencja === "mieszkaniec" || intencja === "soltys" || intencja === "inne" ? intencja : "nie_podano";

    ustawBlad("");
    if (haslo !== haslo2) {
      ustawBlad("Hasła muszą być takie same.");
      return;
    }
    if (haslo.length < 8) {
      ustawBlad("Hasło powinno mieć co najmniej 8 znaków.");
      return;
    }
    if (intencja === "soltys" && !czyPelneImieINazwisko(wyswietlanaNazwa)) {
      ustawBlad(
        "Jako osoba deklarująca sołtysa podaj pełne imię i nazwisko: co najmniej dwa wyrazy (np. Jan Kowalski), każde po min. 2 znaki — zgodnie z wymogiem: jeden aktywny sołtys na sołectwo, identyfikacja musi być czytelna."
      );
      return;
    }

    ustawLaduje(true);
    try {
      const supabase = utworzKlientaSupabasePrzegladarka();
      const nastepnyPoPotwierdzeniu = encodeURIComponent("/panel");
      const { error } = await supabase.auth.signUp({
        email,
        password: haslo,
        options: {
          emailRedirectTo: `${pochodzeniePubliczne}/auth/potwierdz?next=${nastepnyPoPotwierdzeniu}`,
          data: {
            display_name: wyswietlanaNazwa || email.split("@")[0] || "Użytkownik",
            /** Orientacyjnie: nie nadaje roli w bazie — tylko metadane konta (np. do triażu). */
            signup_intent: intencjaDoMetadanych,
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
          Jeśli w projekcie włączone jest potwierdzanie adresu, <strong>Supabase</strong> wysłał wiadomość z
          linkiem (nadawca zwykle z domeny supabase.co) — sprawdź też folder <strong>spam</strong>. Po
          kliknięciu linku zostaniesz przekierowany i zalogowany.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-green-900/90">
          Brak maila, a konto ma już status „potwierdzone” w panelu administratora? Spróbuj{" "}
          <Link href="/logowanie" className="font-medium underline">
            zalogować się
          </Link>{" "}
          tym samym hasłem — czasem potwierdzanie bywa wyłączone w ustawieniach Supabase.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-green-900/80">
          Rolę we wsi (np. mieszkaniec) ustalisz w panelu po zalogowaniu — sołtys przez osobny proces
          weryfikacji.
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
        <p className="mb-1.5 text-xs leading-relaxed text-stone-500">
          Jeśli wybierzesz poniżej opcję <strong>sołtys</strong>, podaj <strong>pełne imię i nazwisko</strong> (dwa
          słowa). W bazie obowiązuje: <strong>jeden aktywny sołtys na jedną wieś</strong> (unikalność techniczna).
        </p>
        <input
          id="reg-nazwa"
          name="wyswietlana_nazwa"
          type="text"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          placeholder="np. Jan Kowalski (dla sołtysa: pełne dane)"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-base text-stone-900 outline-none ring-green-800 focus:ring-2 sm:text-sm"
        />
      </div>
      <fieldset className="rounded-lg border border-stone-200 bg-stone-50/80 p-4">
        <legend className="px-1 text-sm font-medium text-stone-800">
          Kim jesteś / czego szukasz? <span className="font-normal text-stone-500">(opcjonalnie)</span>
        </legend>
        <p className="mb-3 text-xs leading-relaxed text-stone-600">
          To nie nadaje roli w wsi (to robi odrębny wniosek / migracja / zespół). Dla deklaracji <strong>sołtys</strong>{" "}
          musisz wpisać wyżej <strong>imię i nazwisko</strong> — w każdym sołectwie może być tylko <strong>jeden</strong>{" "}
          aktywny sołtys w systemie.
        </p>
        <div className="space-y-2 text-sm text-stone-800">
          <label className="flex cursor-pointer items-start gap-2">
            <input type="radio" name="intencja_rejestracji" value="mieszkaniec" className="mt-1" />
            <span>Chcę dołączyć do wsi jako mieszkaniec (wniosek po zalogowaniu)</span>
          </label>
          <label className="flex cursor-pointer items-start gap-2">
            <input type="radio" name="intencja_rejestracji" value="soltys" className="mt-1" />
            <span>Jestem / będę sołtysem — chcę prowadzić profil wsi (weryfikacja po kontakcie)</span>
          </label>
          <label className="flex cursor-pointer items-start gap-2">
            <input type="radio" name="intencja_rejestracji" value="inne" className="mt-1" />
            <span>Inna sytuacja (np. organizacja, gość)</span>
          </label>
          <label className="flex cursor-pointer items-start gap-2">
            <input type="radio" name="intencja_rejestracji" value="" defaultChecked className="mt-1" />
            <span className="text-stone-600">Wolę nie zaznaczać</span>
          </label>
        </div>
      </fieldset>
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
