"use client";

import { useCallback, useEffect, useState } from "react";

const SESSION_ODRZUC_INSTALACJE = "naszawies-pwa-install-dismissed";

type BeforeInstallPromptEventLike = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaServiceWorkerKlient() {
  const [zdarzenieInstalacji, ustawZdarzenieInstalacji] = useState<BeforeInstallPromptEventLike | null>(null);
  const [pokazBaner, ustawPokazBaner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* ciche — np. HTTP na dev bez HTTPS */
    });

    function onBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      if (sessionStorage.getItem(SESSION_ODRZUC_INSTALACJE)) return;
      ustawZdarzenieInstalacji(e as BeforeInstallPromptEventLike);
      ustawPokazBaner(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  const odrzuc = useCallback(() => {
    sessionStorage.setItem(SESSION_ODRZUC_INSTALACJE, "1");
    ustawPokazBaner(false);
    ustawZdarzenieInstalacji(null);
  }, []);

  const instaluj = useCallback(async () => {
    if (!zdarzenieInstalacji) return;
    try {
      await zdarzenieInstalacji.prompt();
      await zdarzenieInstalacji.userChoice.catch(() => {});
    } finally {
      ustawPokazBaner(false);
      ustawZdarzenieInstalacji(null);
    }
  }, [zdarzenieInstalacji]);

  if (!pokazBaner || !zdarzenieInstalacji) return null;

  return (
    <div
      className="no-print fixed inset-x-0 bottom-0 z-[90] border-t border-stone-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-sm"
      role="dialog"
      aria-label="Instalacja aplikacji"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-800">
          <strong className="font-semibold text-green-950">Zainstaluj naszawies.pl</strong> jak aplikację — szybszy
          dostęp z ekranu głównego i możliwość powiadomień push (po włączeniu w panelu).
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={odrzuc}
            className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
          >
            Później
          </button>
          <button
            type="button"
            onClick={() => void instaluj()}
            className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900"
          >
            Zainstaluj
          </button>
        </div>
      </div>
    </div>
  );
}
