"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { TurnstileAntybot } from "@/components/turnstile/TurnstileAntybot";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

type Props = {
  nastepnaSciezka: string;
  kodBledu?: string;
  szczegolBledu?: string;
  emailStartowy?: string;
};

const OPISY_BLEDOW: Record<string, string> = {
  "potwierdz-email": "Link potwierdzający wygasł lub jest nieprawidłowy. Spróbuj zalogować się lub zarejestrować ponownie.",
  "sesja-zewnetrzna": "Nie udało się dokończyć logowania przez Google. Spróbuj ponownie.",
  konfiguracja: "Logowanie jest chwilowo niedostępne. Spróbuj ponownie później.",
};

export function LogowanieFormularz({ nastepnaSciezka, kodBledu, szczegolBledu, emailStartowy = "" }: Props) {
  const [laduje, ustawLaduje] = useState(false);
  const [pokazHaslo, ustawPokazHaslo] = useState(false);
  const [turnstileToken, ustawTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, ustawTurnstileKey] = useState(0);
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
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      ustawBlad("Potwierdź weryfikację antyspamową (Cloudflare) przed logowaniem.");
      return;
    }

    ustawLaduje(true);
    ustawBlad("");

    try {
      const res = await fetch("/api/logowanie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email,
          haslo,
          nastepnaSciezka: nastepnaSciezka.startsWith("/") ? nastepnaSciezka : "/panel",
          ...(turnstileToken ? { cfTurnstileResponse: turnstileToken } : {}),
        }),
      });
      const d = (await res.json().catch(() => ({}))) as { error?: string; redirect?: string };
      if (!res.ok) {
        ustawBlad(d.error || "Nie udało się zalogować.");
        ustawTurnstileToken(null);
        ustawTurnstileKey((k) => k + 1);
        return;
      }
      const cel = typeof d.redirect === "string" && d.redirect.startsWith("/") ? d.redirect : "/panel";
      window.location.assign(cel);
    } catch {
      ustawBlad("Nie udało się połączyć z serwerem.");
    } finally {
      ustawLaduje(false);
    }
  }

  return (
    <form
      className="mt-4 space-y-4 rounded-2xl border border-stone-200/80 bg-stone-50/50 p-5 ring-1 ring-stone-900/[0.03] sm:mt-6 sm:p-6"
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
          defaultValue={emailStartowy}
          autoComplete="email"
          disabled={laduje}
          className="min-h-[44px] w-full rounded-xl border border-stone-300 px-3 py-2.5 text-stone-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-800/30"
        />
      </div>
      <div>
        <label htmlFor="log-haslo" className="mb-1 block text-sm font-medium text-stone-700">
          Hasło
        </label>
        <div className="relative">
          <input
            id="log-haslo"
            name="haslo"
            type={pokazHaslo ? "text" : "password"}
            required
            autoComplete="current-password"
            minLength={6}
            disabled={laduje}
            className="min-h-[44px] w-full rounded-xl border border-stone-300 px-3 py-2.5 pr-24 text-stone-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-800/30"
          />
          <button
            type="button"
            onClick={() => ustawPokazHaslo((v) => !v)}
            disabled={laduje}
            className="absolute inset-y-1 right-1 rounded-lg px-3 text-xs font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-50"
            aria-label={pokazHaslo ? "Ukryj hasło" : "Pokaż hasło"}
          >
            {pokazHaslo ? "Ukryj" : "Pokaż"}
          </button>
        </div>
      </div>
      {TURNSTILE_SITE_KEY ? (
        <div className="rounded-xl border border-stone-200/80 bg-white/90 px-3 py-3">
          <p className="mb-2 text-xs text-stone-600">Weryfikacja antyspamowa (Cloudflare)</p>
          <TurnstileAntybot key={turnstileKey} siteKey={TURNSTILE_SITE_KEY} onToken={ustawTurnstileToken} />
        </div>
      ) : null}
      <button
        type="submit"
        disabled={laduje || (Boolean(TURNSTILE_SITE_KEY) && !turnstileToken)}
        className="w-full min-h-[44px] rounded-xl bg-gradient-to-b from-green-800 to-green-900 px-4 py-2.5 font-medium text-white shadow-md transition hover:from-green-900 hover:to-green-950 disabled:opacity-60"
      >
        {laduje ? "Logowanie…" : "Zaloguj się"}
      </button>
      <p className="text-center text-sm text-stone-600">
        <Link href="/rejestracja" className="font-medium text-green-900 underline decoration-emerald-800/30 underline-offset-2 hover:decoration-emerald-800">
          Załóż konto
        </Link>
        {" · "}
        <Link href="/reset-hasla" className="font-medium text-green-900 underline decoration-emerald-800/30 underline-offset-2 hover:decoration-emerald-800">
          Nie pamiętasz hasła?
        </Link>
      </p>
    </form>
  );
}
