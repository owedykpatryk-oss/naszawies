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
  `sekcja-poza-foldem ujawnij-scroll wies-sekcja-obudowa mt-10 ${SCROLL_MT} overflow-hidden rounded-2xl border p-4 shadow-sm ring-1 ring-stone-900/[0.02] sm:mt-10 sm:p-6 [content-visibility:auto] [contain-intrinsic-size:auto_420px]`;

const PUSTA =
  `sekcja-poza-foldem mt-10 ${SCROLL_MT} rounded-2xl border border-dashed border-stone-300/90 bg-stone-50/80 px-4 py-5 sm:px-5 sm:py-6`;

/** Wspólna obudowa sekcji profilu wsi — spójna z feedem i linkami przydatnymi. */
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

/** Klasa karty listy w sekcjach profilu wsi. */
export const KARTA_LISTY_WIES =
  "karta-wow rounded-xl border border-stone-200/90 bg-white px-4 py-3 shadow-sm ring-1 ring-stone-900/[0.02]";
