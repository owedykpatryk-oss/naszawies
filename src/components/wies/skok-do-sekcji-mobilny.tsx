"use client";

import { useCallback, useEffect, useState } from "react";
import type { ZakladkaProfiluWsi } from "@/components/wies/wies-zakladki-profilu";

type Props = {
  zakladki: ZakladkaProfiluWsi[];
};

/** FAB + dolna lista sekcji — szybki skok na mobile (profil wsi). */
export function SkokDoSekcjiMobilny({ zakladki }: Props) {
  const [otwarte, ustawOtwarte] = useState(false);

  const przejdz = useCallback((hash: string) => {
    const cel = document.querySelector(hash);
    if (cel) {
      const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const rawOffset = getComputedStyle(document.documentElement).getPropertyValue("--sticky-nav-offset").trim();
      let naglowek = 60;
      if (rawOffset.endsWith("rem")) naglowek = parseFloat(rawOffset) * rootPx;
      else if (rawOffset.endsWith("px")) naglowek = parseFloat(rawOffset);
      const pasekZakladek = document.querySelector<HTMLElement>(".wies-zakladki-sticky");
      const margines = naglowek + (pasekZakladek?.offsetHeight ?? 0) + 12;
      const top = cel.getBoundingClientRect().top + window.scrollY - margines;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      history.replaceState(null, "", hash);
    }
    ustawOtwarte(false);
  }, []);

  useEffect(() => {
    if (!otwarte) return;
    document.body.classList.add("skok-sekcji-otwarte");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") ustawOtwarte(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("skok-sekcji-otwarte");
      window.removeEventListener("keydown", onKey);
    };
  }, [otwarte]);

  if (zakladki.length < 2) return null;

  return (
    <div className="skok-sekcji-wrap no-print lg:hidden">
      <button
        type="button"
        className="skok-sekcji-fab"
        aria-expanded={otwarte}
        aria-haspopup="dialog"
        onClick={() => ustawOtwarte((v) => !v)}
      >
        <span aria-hidden className="text-base leading-none">
          📑
        </span>
        <span>Sekcje</span>
      </button>

      {otwarte ? (
        <>
          <button
            type="button"
            className="skok-sekcji-backdrop"
            aria-label="Zamknij listę sekcji"
            onClick={() => ustawOtwarte(false)}
          />
          <div className="skok-sekcji-sheet" role="dialog" aria-label="Przejdź do sekcji">
            <div className="skok-sekcji-sheet__uchwyt" aria-hidden />
            <p className="skok-sekcji-sheet__tytul">Przejdź do sekcji</p>
            <ul className="skok-sekcji-sheet__lista">
              {zakladki.map((z) => (
                <li key={z.href}>
                  <button
                    type="button"
                    className="skok-sekcji-sheet__link"
                    onClick={() => przejdz(z.href)}
                  >
                    {z.ikona ? <span aria-hidden>{z.ikona}</span> : null}
                    <span>{z.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
