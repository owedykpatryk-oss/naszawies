"use client";

import { useId, useRef, useState, useTransition } from "react";
import { pobierzPdfZElementuHtml } from "@/lib/dokumenty/pobierz-pdf-z-elementu";

type Props = {
  html: string;
  nazwaPliku: string;
  etykietaPrzycisku?: string;
  className?: string;
};

/** Renderuje ukryty HTML i pobiera PDF (html2pdf). */
export function EksportHtmlPdfKlient({
  html,
  nazwaPliku,
  etykietaPrzycisku = "Pobierz PDF",
  className = "",
}: Props) {
  const id = useId().replace(/:/g, "");
  const ref = useRef<HTMLDivElement>(null);
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  return (
    <span className={className}>
      <div
        id={`eksport-pdf-${id}`}
        ref={ref}
        className="pointer-events-none fixed -left-[9999px] top-0 w-[720px] bg-white p-4"
        aria-hidden
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <button
        type="button"
        disabled={czek}
        className="btn-panel-secondary"
        onClick={() => {
          ustawBlad("");
          startT(async () => {
            const el = ref.current;
            if (!el) {
              ustawBlad("Nie udało się przygotować dokumentu.");
              return;
            }
            const w = await pobierzPdfZElementuHtml(el, { nazwaPliku });
            if (!w.ok) ustawBlad(w.komunikat);
          });
        }}
      >
        {czek ? "Generuję PDF…" : etykietaPrzycisku}
      </button>
      {blad ? <span className="ml-2 text-xs text-red-800">{blad}</span> : null}
    </span>
  );
}
