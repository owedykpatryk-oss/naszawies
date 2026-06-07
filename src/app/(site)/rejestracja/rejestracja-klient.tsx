"use client";

import { useCallback, useState } from "react";
import type { WpisWsi } from "@/components/wies/wyszukiwarka-wsi";
import { TurnstileAntybot } from "@/components/turnstile/TurnstileAntybot";
import { LogowanieProwiderzy } from "../logowanie/logowanie-prowiderzy";
import { RejestracjaFormularz } from "./rejestracja-formularz";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";

type Props = {
  pochodzeniePubliczne: string;
  nastepnaSciezka: string;
  domyslnaIntencja?: "mieszkaniec" | "soltys";
  domyslnaWies?: WpisWsi | null;
};

export function RejestracjaKlient({
  pochodzeniePubliczne,
  nastepnaSciezka,
  domyslnaIntencja,
  domyslnaWies = null,
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
        <div className="mt-6 rounded-lg border border-stone-200 bg-stone-50 p-3">
          <p className="mb-2 text-xs text-stone-600">
            Weryfikacja antyspamowa (Cloudflare) — wystarczy raz przed rejestracją
          </p>
          <TurnstileAntybot
            key={turnstileKey}
            siteKey={TURNSTILE_SITE_KEY}
            akcja="rejestracja"
            onToken={ustawTurnstileToken}
          />
        </div>
      ) : null}

      <LogowanieProwiderzy
        pochodzeniePubliczne={pochodzeniePubliczne}
        nastepnaSciezka={nastepnaSciezka}
        turnstileToken={turnstileToken}
        wymagajTurnstile={Boolean(TURNSTILE_SITE_KEY)}
        onTurnstileZuzyty={zresetujTurnstile}
      />

      <p className="mt-8 text-center text-sm text-stone-500">lub zarejestruj się e-mailem</p>

      <RejestracjaFormularz
        nastepnaSciezka={nastepnaSciezka}
        domyslnaIntencja={domyslnaIntencja}
        domyslnaWies={domyslnaWies}
        turnstileToken={turnstileToken}
        wymagajTurnstile={Boolean(TURNSTILE_SITE_KEY)}
        onTurnstileZuzyty={zresetujTurnstile}
      />
    </>
  );
}
