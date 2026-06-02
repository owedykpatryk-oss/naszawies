"use client";

import { useState } from "react";
import { TurnstileAntybot } from "@/components/turnstile/TurnstileAntybot";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

type Props = {
  /** Pełny URL strony, np. https://naszawies.pl */
  pochodzeniePubliczne: string;
  nastepnaSciezka: string;
};

export function LogowanieProwiderzy({ pochodzeniePubliczne, nastepnaSciezka }: Props) {
  const [laduje, ustawLaduje] = useState(false);
  const [blad, ustawBlad] = useState("");
  const [turnstileToken, ustawTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, ustawTurnstileKey] = useState(0);

  async function zalogujPrzezGoogle() {
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      ustawBlad("Potwierdź weryfikację antyspamową (Cloudflare) przed logowaniem przez Google.");
      return;
    }

    ustawBlad("");
    ustawLaduje(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          pochodzeniePubliczne,
          nastepnaSciezka: nastepnaSciezka.startsWith("/") ? nastepnaSciezka : "/panel",
          ...(turnstileToken ? { cfTurnstileResponse: turnstileToken } : {}),
        }),
      });
      const d = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
      if (!res.ok || !d.url) {
        ustawBlad(d.error || "Nie udało się rozpocząć logowania przez Google.");
        ustawTurnstileToken(null);
        ustawTurnstileKey((k) => k + 1);
        ustawLaduje(false);
        return;
      }
      window.location.assign(d.url);
    } catch {
      ustawBlad("Nie udało się połączyć z serwerem.");
      ustawLaduje(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="rounded-lg border border-sky-100 bg-sky-50/80 px-3 py-2.5 text-xs leading-relaxed text-sky-950">
        Po zalogowaniu przez Google zaakceptujesz <strong>regulamin i politykę prywatności</strong>, potem wybierzesz
        miejscowość i rolę — konto nie jest automatycznie przypisane do żadnej wsi.
      </p>
      {blad ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200/80" role="alert">
          {blad}
        </p>
      ) : null}
      {TURNSTILE_SITE_KEY ? (
        <div className="rounded-xl border border-stone-200/80 bg-white/90 px-3 py-3">
          <p className="mb-2 text-xs text-stone-600">Weryfikacja antyspamowa (Cloudflare)</p>
          <TurnstileAntybot key={turnstileKey} siteKey={TURNSTILE_SITE_KEY} onToken={ustawTurnstileToken} />
        </div>
      ) : null}
      <p className="text-center text-xs font-medium uppercase tracking-wider text-stone-500">Kontynuuj przez</p>
      <button
        type="button"
        disabled={laduje || (Boolean(TURNSTILE_SITE_KEY) && !turnstileToken)}
        onClick={() => void zalogujPrzezGoogle()}
        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-stone-300/90 bg-white px-4 py-2.5 text-sm font-medium text-stone-800 shadow-sm transition hover:border-stone-400 hover:bg-stone-50/90 disabled:opacity-60"
      >
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {laduje ? "Przekierowanie…" : "Google"}
      </button>
    </div>
  );
}
