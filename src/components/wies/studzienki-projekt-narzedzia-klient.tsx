"use client";

import { useCallback, useState } from "react";

export function StudzienkiProjektNarzedziaKlient() {
  const [stan, ustawStan] = useState<"idle" | "ok" | "err">("idle");

  const kopiuj = useCallback(() => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    void navigator.clipboard.writeText(url).then(
      () => {
        ustawStan("ok");
        setTimeout(() => ustawStan("idle"), 2500);
      },
      () => {
        ustawStan("err");
        setTimeout(() => ustawStan("idle"), 3000);
      }
    );
  }, []);

  const klasaPrzycisku =
    "rounded-lg border border-white/30 bg-white/[0.12] px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-black/20 backdrop-blur-md transition hover:border-white/45 hover:bg-white/[0.22] hover:shadow-lg hover:shadow-emerald-950/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => void kopiuj()} className={klasaPrzycisku}>
        {stan === "ok" ? "Skopiowano link" : stan === "err" ? "Nie udało się skopiować" : "Kopiuj link do strony"}
      </button>
    </div>
  );
}
