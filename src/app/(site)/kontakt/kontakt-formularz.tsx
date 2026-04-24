"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export function KontaktFormularz() {
  const [laduje, ustawLaduje] = useState(false);
  const [wynik, ustawWynik] = useState<"brak" | "ok" | "blad">("brak");
  const [komunikat, ustawKomunikat] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    ustawLaduje(true);
    ustawWynik("brak");
    ustawKomunikat("");

    const body = {
      imie: String(fd.get("imie") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      temat: String(fd.get("temat") || "").trim(),
      wiadomosc: String(fd.get("wiadomosc") || "").trim(),
      rodoZaakceptowane: fd.get("zgoda") === "on",
      bottrap: String(fd.get("bottrap") || ""),
    };

    try {
      const res = await fetch("/api/kontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        ustawWynik("blad");
        ustawKomunikat(d.error || "Nie udało się wysłać.");
        return;
      }
      ustawWynik("ok");
      ustawKomunikat("Wiadomość została wysłana. Dziękujemy!");
      form.reset();
    } catch {
      ustawWynik("blad");
      ustawKomunikat("Brak połączenia z serwerem.");
    } finally {
      ustawLaduje(false);
    }
  }

  return (
    <form
      className="mt-10 space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
      onSubmit={onSubmit}
    >
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="kontakt-bottrap">Pozostaw puste</label>
        <input type="text" id="kontakt-bottrap" name="bottrap" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label htmlFor="kontakt-imie" className="mb-1 block text-sm font-semibold text-stone-700">
          Imię
        </label>
        <input
          id="kontakt-imie"
          name="imie"
          required
          minLength={2}
          maxLength={120}
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900"
        />
      </div>
      <div>
        <label htmlFor="kontakt-email" className="mb-1 block text-sm font-semibold text-stone-700">
          E-mail
        </label>
        <input
          id="kontakt-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900"
        />
      </div>
      <div>
        <label htmlFor="kontakt-temat" className="mb-1 block text-sm font-semibold text-stone-700">
          Temat
        </label>
        <input
          id="kontakt-temat"
          name="temat"
          required
          minLength={3}
          maxLength={200}
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900"
        />
      </div>
      <div>
        <label htmlFor="kontakt-wiadomosc" className="mb-1 block text-sm font-semibold text-stone-700">
          Wiadomość
        </label>
        <textarea
          id="kontakt-wiadomosc"
          name="wiadomosc"
          required
          minLength={10}
          maxLength={8000}
          rows={6}
          className="w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900"
        />
      </div>
      <div className="flex items-start gap-2">
        <input type="checkbox" id="kontakt-zgoda" name="zgoda" required className="mt-1 h-4 w-4 accent-green-800" />
        <label htmlFor="kontakt-zgoda" className="text-sm text-stone-700">
          Akceptuję{" "}
          <Link href="/regulamin" className="font-semibold text-green-800 underline" target="_blank">
            Regulamin
          </Link>{" "}
          i zapoznałem(-am) się z{" "}
          <Link href="/polityka-prywatnosci" className="font-semibold text-green-800 underline" target="_blank">
            Polityką prywatności
          </Link>
          . Wyrażam zgodę na przetwarzanie danych w celu udzielenia odpowiedzi.
        </label>
      </div>
      <button
        type="submit"
        disabled={laduje}
        className="rounded-full bg-green-800 px-6 py-3 font-semibold text-white transition hover:bg-green-900 disabled:opacity-60"
      >
        {laduje ? "Wysyłanie…" : "Wyślij wiadomość"}
      </button>
      {komunikat ? (
        <p
          className={
            wynik === "ok" ? "text-sm font-medium text-green-800" : "text-sm font-medium text-red-800"
          }
          role="status"
        >
          {komunikat}
        </p>
      ) : null}
    </form>
  );
}
