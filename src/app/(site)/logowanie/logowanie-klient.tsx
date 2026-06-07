"use client";

import { useCallback, useState } from "react";
import { TurnstileAntybot } from "@/components/turnstile/TurnstileAntybot";
import { LogowanieFormularz } from "./logowanie-formularz";
import { LogowanieProwiderzy } from "./logowanie-prowiderzy";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

type Props = {
  pochodzeniePubliczne: string;
  nastepnaSciezka: string;
  kodBledu?: string;
  szczegolBledu?: string;
  emailStartowy?: string;
};

/** Jedna weryfikacja Turnstile współdzielona przez Google i logowanie e-mail. */
export function LogowanieKlient({
  pochodzeniePubliczne,
  nastepnaSciezka,
  kodBledu,
  szczegolBledu,
  emailStartowy = "",
}: Props) {
  const [turnstileToken, ustawTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, ustawTurnstileKey] = useState(0);

  const zresetujTurnstile = useCallback(() => {
    ustawTurnstileToken(null);
    ustawTurnstileKey((k) => k + 1);
  }, []);

  return (
    <>
      {TURNSTILE_SITE_KEY ? (
        <div className="rounded-xl border border-stone-200/80 bg-white/90 px-3 py-3">
          <p className="mb-2 text-xs text-stone-600">
            Weryfikacja antyspamowa (Cloudflare) — wystarczy raz przed logowaniem
          </p>
          <TurnstileAntybot
            key={turnstileKey}
            siteKey={TURNSTILE_SITE_KEY}
            akcja="logowanie"
            onToken={ustawTurnstileToken}
          />
        </div>
      ) : null}

      <div className="mt-6">
        <LogowanieProwiderzy
          pochodzeniePubliczne={pochodzeniePubliczne}
          nastepnaSciezka={nastepnaSciezka}
          turnstileToken={turnstileToken}
          wymagajTurnstile={Boolean(TURNSTILE_SITE_KEY)}
          onTurnstileZuzyty={zresetujTurnstile}
        />
      </div>

      <p className="mt-8 text-center text-xs font-medium uppercase tracking-wider text-stone-500">
        lub e-mail
      </p>

      <LogowanieFormularz
        nastepnaSciezka={nastepnaSciezka}
        kodBledu={kodBledu}
        szczegolBledu={szczegolBledu}
        emailStartowy={emailStartowy}
        turnstileToken={turnstileToken}
        wymagajTurnstile={Boolean(TURNSTILE_SITE_KEY)}
        onTurnstileZuzyty={zresetujTurnstile}
      />
    </>
  );
}
