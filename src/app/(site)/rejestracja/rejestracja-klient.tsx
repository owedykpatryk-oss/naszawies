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
        <div className="auth-strona__turnstile">
          <p className="auth-strona__turnstile-etykieta">Krok 1 · Weryfikacja antyspamowa</p>
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

      <p className="auth-strona__separator">lub e-mail</p>

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
