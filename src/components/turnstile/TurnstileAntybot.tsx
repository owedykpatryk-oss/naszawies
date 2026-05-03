"use client";

import { Turnstile } from "@marsidev/react-turnstile";

type Props = {
  siteKey: string;
  onToken: (token: string | null) => void;
};

/**
 * Widget Cloudflare Turnstile (managed, PL).
 */
export function TurnstileAntybot({ siteKey, onToken }: Props) {
  if (!siteKey.trim()) {
    return null;
  }

  return (
    <div className="min-h-[65px]">
      <Turnstile
        siteKey={siteKey.trim()}
        options={{
          language: "pl",
          theme: "light",
          size: "normal",
        }}
        onSuccess={(token) => onToken(token)}
        onExpire={() => onToken(null)}
        onError={() => onToken(null)}
      />
    </div>
  );
}
