import type { ReactNode } from "react";

type Props = {
  id?: string;
  /** Pusta sekcja — obramowanie przerywane bez gradientu. */
  pusta?: boolean;
  /** Wariant tła sekcji (szkoła = niebieski akcent). */
  wariant?: "domyslny" | "szkola" | "historia" | "sport";
  className?: string;
  children: ReactNode;
};

const SCROLL_MT =
  "scroll-mt-[calc(var(--sticky-nav-offset,3.75rem)+3.5rem)] sm:scroll-mt-[calc(var(--sticky-nav-offset,4rem)+3rem)]";

const PELNA =
  `sekcja-poza-foldem ujawnij-scroll wies-sekcja-obudowa panel-karta mt-10 ${SCROLL_MT} overflow-hidden p-4 sm:mt-10 sm:p-6 [content-visibility:auto] [contain-intrinsic-size:auto_420px]`;

const PUSTA =
  `sekcja-poza-foldem mt-10 ${SCROLL_MT} rounded-2xl border border-dashed border-stone-300/90 bg-stone-50/80 px-4 py-5 sm:px-5 sm:py-6`;

/** Klasa karty listy w sekcjach profilu wsi — spójna z resztą app. */
export const KARTA_LISTY_WIES = "karta-skrot-modulu !p-3.5";

/** Wspólna obudowa sekcji profilu wsi — spójna z kartami w panelu. */
export function OslonaSekcjiWies({ id, pusta = false, wariant = "domyslny", className = "", children }: Props) {
  const wariantKlasa =
    !pusta && wariant === "szkola"
      ? "wies-sekcja-szkola"
      : !pusta && wariant === "historia"
        ? "wies-sekcja-historia"
        : !pusta && wariant === "sport"
          ? "wies-sekcja-sport"
          : "";
  return (
    <section id={id} className={`${pusta ? PUSTA : PELNA} ${wariantKlasa} ${className}`.trim()}>
      {children}
    </section>
  );
}
