"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { TurnstileAntybot } from "@/components/turnstile/TurnstileAntybot";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

export function ResetHaslaFormularz() {
  const [laduje, ustawLaduje] = useState(false);
  const [blad, ustawBlad] = useState("");
  const [wyslano, ustawWyslano] = useState(false);
  const [turnstileToken, ustawTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, ustawTurnstileKey] = useState(0);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") || "").trim();
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      ustawBlad("Potwierdź weryfikację antyspamową (Cloudflare) przed wysłaniem.");
      return;
    }

    ustawLaduje(true);
    ustawBlad("");
    try {
      const res = await fetch("/api/reset-hasla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          ...(turnstileToken ? { cfTurnstileResponse: turnstileToken } : {}),
        }),
      });
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        ustawBlad(d.error || "Nie udało się wysłać linku resetującego.");
        ustawTurnstileToken(null);
        ustawTurnstileKey((k) => k + 1);
        return;
      }
      ustawWyslano(true);
    } catch {
      ustawBlad("Nie udało się połączyć z serwerem.");
    } finally {
      ustawLaduje(false);
    }
  }

  if (wyslano) {
    return (
      <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 text-stone-800">
        <p className="font-medium text-green-900">Sprawdź skrzynkę</p>
        <p className="mt-2 text-sm leading-relaxed">
          Jeśli konto istnieje, wyślemy wiadomość z linkiem do ustawienia nowego hasła. Link jest
          ważny krótko — użyj go od razu.
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
        <label htmlFor="rst-email" className="mb-1 block text-sm font-medium text-stone-700">
          E-mail konta
        </label>
        <input
          id="rst-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 outline-none ring-green-800 focus:ring-2"
        />
      </div>
      {TURNSTILE_SITE_KEY ? (
        <TurnstileAntybot
          key={turnstileKey}
          siteKey={TURNSTILE_SITE_KEY}
          akcja="reset-hasla"
          onToken={ustawTurnstileToken}
        />
      ) : null}
      <button
        type="submit"
        disabled={laduje}
        className="w-full rounded-lg bg-green-800 px-4 py-2.5 font-medium text-white transition hover:bg-green-900 disabled:opacity-60"
      >
        {laduje ? "Wysyłanie…" : "Wyślij link resetujący"}
      </button>
    </form>
  );
}
