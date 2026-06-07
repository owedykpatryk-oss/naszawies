"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { useState } from "react";

type Props = {
  siteKey: string;
  /** Identyfikator akcji w panelu Cloudflare (np. logowanie, rejestracja). */
  akcja?: string;
  onToken: (token: string | null) => void;
  onBlad?: (komunikat: string | null) => void;
};

/**
 * Widget Cloudflare Turnstile (managed, PL).
 * Automatycznie odświeża wygasły token i ponawia po błędzie sieci.
 */
export function TurnstileAntybot({ siteKey, akcja, onToken, onBlad }: Props) {
  const [komunikat, ustawKomunikat] = useState<string | null>(null);

  if (!siteKey.trim()) {
    return null;
  }

  function ustawBlad(komunikat: string | null) {
    ustawKomunikat(komunikat);
    onBlad?.(komunikat);
  }

  return (
    <div className="min-h-[65px]">
      {komunikat ? (
        <p className="mb-2 text-xs text-amber-800" role="status">
          {komunikat}
        </p>
      ) : null}
      <Turnstile
        siteKey={siteKey.trim()}
        options={{
          language: "pl",
          theme: "light",
          size: "normal",
          refreshExpired: "auto",
          retry: "auto",
          ...(akcja ? { action: akcja } : {}),
        }}
        onSuccess={(token) => {
          ustawKomunikat(null);
          onBlad?.(null);
          onToken(token);
        }}
        onExpire={() => {
          onToken(null);
          ustawBlad("Weryfikacja wygasła — odświeżamy pole automatycznie…");
        }}
        onError={() => {
          onToken(null);
          ustawBlad(
            "Nie udało się załadować weryfikacji Cloudflare. Wyłącz blokadę reklam, zwolnij miejsce na dysku lub odśwież stronę.",
          );
        }}
      />
    </div>
  );
}
