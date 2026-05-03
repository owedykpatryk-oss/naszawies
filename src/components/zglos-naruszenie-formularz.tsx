"use client";

import { FormEvent, useState } from "react";
import { TurnstileAntybot } from "@/components/turnstile/TurnstileAntybot";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

export function ZglosNaruszenieFormularz() {
  const [blad, ustawBlad] = useState("");
  const [ok, ustawOk] = useState(false);
  const [laduje, ustawLaduje] = useState(false);
  const [turnstileToken, ustawTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, ustawTurnstileKey] = useState(0);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    ustawOk(false);
    const fd = new FormData(e.currentTarget);
    const bottrap = String(fd.get("bottrap") ?? "");
    if (bottrap.trim()) {
      ustawBlad("Odrzucono.");
      return;
    }
    const body = {
      imie: String(fd.get("imie") ?? ""),
      email: String(fd.get("email") ?? ""),
      urlStrony: String(fd.get("urlStrony") ?? ""),
      opis: String(fd.get("opis") ?? ""),
      rodoZaakceptowane: fd.get("rodo") === "1",
      bottrap: "",
      ...(turnstileToken ? { cfTurnstileResponse: turnstileToken } : {}),
    };
    ustawLaduje(true);
    try {
      const res = await fetch("/api/zglos-naruszenie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) {
        ustawBlad(d.error ?? "Nie udało się wysłać.");
        return;
      }
      ustawOk(true);
      e.currentTarget.reset();
      ustawTurnstileToken(null);
      ustawTurnstileKey((k) => k + 1);
    } catch {
      ustawBlad("Błąd sieci. Spróbuj ponownie.");
    } finally {
      ustawLaduje(false);
    }
  }

  return (
    <form className="mt-8 max-w-xl space-y-4" onSubmit={onSubmit}>
      <input type="text" name="bottrap" autoComplete="off" tabIndex={-1} className="hidden" aria-hidden />

      {ok ? (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-900" role="status">
          Zgłoszenie zostało wysłane. Odpowiemy na podany adres e-mail.
        </p>
      ) : null}
      {blad ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}

      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="zn-imie">
          Imię i nazwisko
        </label>
        <input
          id="zn-imie"
          name="imie"
          required
          maxLength={120}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="zn-email">
          E-mail kontaktowy
        </label>
        <input
          id="zn-email"
          name="email"
          type="email"
          required
          maxLength={254}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="zn-url">
          Adres strony (pełny URL treści)
        </label>
        <input
          id="zn-url"
          name="urlStrony"
          type="url"
          required
          placeholder="https://naszawies.pl/…"
          maxLength={2048}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-stone-700" htmlFor="zn-opis">
          Opis problemu (min. 20 znaków)
        </label>
        <textarea
          id="zn-opis"
          name="opis"
          required
          minLength={20}
          maxLength={8000}
          rows={8}
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          placeholder="Opisz, co narusza prawo lub regulamin (np. treść, kontekst, data)."
        />
      </div>
      {TURNSTILE_SITE_KEY ? (
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
          <p className="mb-2 text-xs text-stone-600">Weryfikacja antyspamowa</p>
          <TurnstileAntybot key={turnstileKey} siteKey={TURNSTILE_SITE_KEY} onToken={ustawTurnstileToken} />
        </div>
      ) : null}
      <label className="flex items-start gap-2 text-sm text-stone-700">
        <input type="checkbox" name="rodo" value="1" required className="mt-1" />
        <span>
          Akceptuję przetwarzanie danych w celu rozpatrzenia zgłoszenia, zgodnie z{" "}
          <a href="/polityka-prywatnosci" className="text-green-800 underline">
            polityką prywatności
          </a>
          .
        </span>
      </label>
      <button
        type="submit"
        disabled={laduje || (Boolean(TURNSTILE_SITE_KEY) && !turnstileToken)}
        className="rounded-lg bg-green-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
      >
        {laduje ? "Wysyłanie…" : "Wyślij zgłoszenie"}
      </button>
    </form>
  );
}
