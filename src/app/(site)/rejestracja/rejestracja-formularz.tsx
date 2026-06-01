"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import type { WpisWsi } from "@/components/wies/wyszukiwarka-wsi";
import { czyPelneImieINazwisko } from "@/lib/rejestracja/validate-imie-soltysa";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";
import { PolaZgodyRejestracji, czyZaznaczoneZgodyRejestracji } from "@/components/rodo/pola-zgody-rejestracji";
import { AKTUALNY_BUNDLE_WERSJI_PRAWNYCH } from "@/lib/rodo/wersje-dokumentow";
import { RejestracjaWyborWsi } from "./rejestracja-wybor-wsi";

type Props = {
  /** Publiczny adres strony (np. https://naszawies.pl) używany w linku z e-maila potwierdzającego. */
  pochodzeniePubliczne: string;
  nastepnaSciezka?: string;
  domyslnaIntencja?: "mieszkaniec" | "soltys";
  domyslnaWies?: WpisWsi | null;
};

export function RejestracjaFormularz({
  pochodzeniePubliczne,
  nastepnaSciezka = "/panel",
  domyslnaIntencja,
  domyslnaWies = null,
}: Props) {
  const [laduje, ustawLaduje] = useState(false);
  const [blad, ustawBlad] = useState("");
  const [sukces, ustawSukces] = useState(false);
  const [wybranaWies, ustawWybranaWies] = useState<WpisWsi | null>(domyslnaWies);
  const [intencja, ustawIntencje] = useState<"mieszkaniec" | "soltys" | "inne" | "">(() => {
    if (domyslnaIntencja === "mieszkaniec" || domyslnaIntencja === "soltys") return domyslnaIntencja;
    if (domyslnaWies) return "mieszkaniec";
    return "";
  });
  const [podsumowanieSukcesu, ustawPodsumowanieSukcesu] = useState<{
    intencja: string;
    nazwaWsi: string | null;
  } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") || "").trim();
    const haslo = String(fd.get("haslo") || "");
    const haslo2 = String(fd.get("haslo2") || "");
    const wyswietlanaNazwa = String(fd.get("wyswietlana_nazwa") || "").trim();
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
    if ((intencja === "mieszkaniec" || intencja === "soltys") && !wybranaWies) {
      ustawBlad("Dla wybranej roli wskaż miejscowość z katalogu (sekcja „Która miejscowość?”).");
      return;
    }
    if (!czyZaznaczoneZgodyRejestracji(fd)) {
      ustawBlad("Zaakceptuj regulamin, politykę prywatności i potwierdź wiek (16 lat).");
      return;
    }

    const legalAt = new Date().toISOString();
    ustawLaduje(true);
    try {
      const supabase = utworzKlientaSupabasePrzegladarka();
      const nastepnyPoPotwierdzeniu = encodeURIComponent(
        nastepnaSciezka.startsWith("/") ? nastepnaSciezka : "/panel",
      );
      const { error } = await supabase.auth.signUp({
        email,
        password: haslo,
        options: {
          emailRedirectTo: `${pochodzeniePubliczne}/auth/potwierdz?next=${nastepnyPoPotwierdzeniu}`,
          data: {
            display_name: wyswietlanaNazwa || email.split("@")[0] || "Użytkownik",
            /** Orientacyjnie: nie nadaje roli w bazie — tylko metadane konta (np. do triażu). */
            signup_intent: intencjaDoMetadanych,
            signup_village_id: wybranaWies?.id ?? "",
            signup_village_label: wybranaWies
              ? `${wybranaWies.nazwa} · ${wybranaWies.gmina}, ${wybranaWies.powiat}, ${wybranaWies.wojewodztwo}`
              : "",
            signup_village_teryt: wybranaWies?.terytId ?? "",
            legal_accepted_at: legalAt,
            legal_bundle_version: AKTUALNY_BUNDLE_WERSJI_PRAWNYCH,
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
      ustawPodsumowanieSukcesu({
        intencja: intencjaDoMetadanych,
        nazwaWsi: wybranaWies?.nazwa ?? null,
      });
      ustawSukces(true);
      ustawWybranaWies(null);
      ustawIntencje("");
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
          Wysłaliśmy wiadomość z linkiem potwierdzającym. Kliknij w link, aby dokończyć rejestrację. Jeśli nic
          nie widać w skrzynce odbiorczej, zajrzyj do folderu z niechcianą pocztą (np. Oferty, Spam).
        </p>
        <p className="mt-3 text-sm leading-relaxed text-green-900/90">
          Gdy konto jest już aktywne, możesz od razu{" "}
          <Link href={`/logowanie?next=${encodeURIComponent(nastepnaSciezka)}`} className="font-medium underline">
            zalogować się
          </Link>{" "}
          tym samym hasłem.
        </p>
        {podsumowanieSukcesu?.intencja === "mieszkaniec" && podsumowanieSukcesu.nazwaWsi ? (
          <p className="mt-2 text-xs leading-relaxed text-green-900/80">
            Po kliknięciu w link potwierdzający wniosek o mieszkańca wsi{" "}
            <strong>{podsumowanieSukcesu.nazwaWsi}</strong> złożymy automatycznie — sołtys zobaczy go w panelu
            wsi.
          </p>
        ) : podsumowanieSukcesu?.intencja === "soltys" && podsumowanieSukcesu.nazwaWsi ? (
          <p className="mt-2 text-xs leading-relaxed text-green-900/80">
            Po potwierdzeniu e-maila wniosek o rolę sołtysa dla <strong>{podsumowanieSukcesu.nazwaWsi}</strong>{" "}
            utworzy się w{" "}
            <Link href="/panel/wniosek-soltysa" className="font-medium underline">
              panelu → Wniosek sołtysa
            </Link>
            .
          </p>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-green-900/80">
            Po potwierdzeniu e-maila wybierzesz miejscowość w krótkim kreatorze panelu (lub w profilu konta).
          </p>
        )}
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
          słowa). W serwisie: <strong>jeden aktywny sołtys na jedną miejscowość</strong> (ustalone zasady
          weryfikacji).
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
          To nie nadaje roli w wsi (to ustalimy w oddzielnym wniosku / po weryfikacji). Dla deklaracji <strong>sołtys</strong>{" "}
          musisz wpisać wyżej <strong>imię i nazwisko</strong> — w każdym sołectwie może być tylko <strong>jeden</strong>{" "}
          aktywny sołtys. Jeśli wybierzesz <strong>mieszkaniec</strong> lub <strong>sołtys</strong>, wskaż też
          miejscowość w sekcji poniżej.
        </p>
        <div className="space-y-2 text-sm text-stone-800">
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="radio"
              name="intencja_rejestracji"
              value="mieszkaniec"
              className="mt-1"
              checked={intencja === "mieszkaniec"}
              onChange={() => ustawIntencje("mieszkaniec")}
            />
            <span>Chcę dołączyć do wsi jako mieszkaniec (wniosek po potwierdzeniu e-maila)</span>
          </label>
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="radio"
              name="intencja_rejestracji"
              value="soltys"
              className="mt-1"
              checked={intencja === "soltys"}
              onChange={() => ustawIntencje("soltys")}
            />
            <span>
              Jestem / będę sołtysem — po potwierdzeniu e-maila złożysz wniosek w{" "}
              <strong>panelu → Wniosek o rolę sołtysa</strong> (weryfikacja przez administratora platformy)
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="radio"
              name="intencja_rejestracji"
              value="inne"
              className="mt-1"
              checked={intencja === "inne"}
              onChange={() => ustawIntencje("inne")}
            />
            <span>Inna sytuacja (np. organizacja, gość)</span>
          </label>
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="radio"
              name="intencja_rejestracji"
              value=""
              className="mt-1"
              checked={intencja === ""}
              onChange={() => ustawIntencje("")}
            />
            <span className="text-stone-600">Wolę nie zaznaczać</span>
          </label>
        </div>
      </fieldset>
      <RejestracjaWyborWsi wybrana={wybranaWies} onZmiana={ustawWybranaWies} />
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
      <PolaZgodyRejestracji idPrefix="reg" />
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
      <p className="text-center text-xs text-stone-500">
        Dane przetwarzamy zgodnie z{" "}
        <Link href="/polityka-prywatnosci" className="underline">
          polityką prywatności
        </Link>
        . Nie wysyłamy spamu marketingowego.
      </p>
      <p className="text-center text-sm text-stone-600">
        Masz już konto?{" "}
        <Link href="/logowanie" className="text-green-800 underline">
          Zaloguj się
        </Link>
      </p>
    </form>
  );
}
