"use client";

import { useEffect } from "react";

/** Po wejściu z ?szkola=1 przewija do kotwicy sekcji. */
export function PrzewinDoSekcjiKlient({ id, wlacz }: { id: string; wlacz: boolean }) {
  useEffect(() => {
    if (!wlacz) return;
    const el = document.getElementById(id);
    if (el) {
      window.requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [id, wlacz]);
  return null;
}
