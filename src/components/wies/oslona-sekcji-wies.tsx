import type { ReactNode } from "react";

type Props = {
  id?: string;
  /** Pusta sekcja — obramowanie przerywane bez gradientu. */
  pusta?: boolean;
  className?: string;
  children: ReactNode;
};

const PELNA =
  "sekcja-poza-foldem wow-wejscie mt-10 scroll-mt-8 overflow-hidden rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-[#f5f9f0] via-white to-sky-50/40 p-5 shadow-sm ring-1 ring-stone-900/[0.02] sm:p-6 [content-visibility:auto] [contain-intrinsic-size:auto_420px]";

const PUSTA =
  "sekcja-poza-foldem mt-10 scroll-mt-8 rounded-2xl border border-dashed border-stone-300/90 bg-stone-50/80 px-5 py-6";

/** Wspólna obudowa sekcji profilu wsi — spójna z feedem i linkami przydatnymi. */
export function OslonaSekcjiWies({ id, pusta = false, className = "", children }: Props) {
  return (
    <section id={id} className={`${pusta ? PUSTA : PELNA} ${className}`.trim()}>
      {children}
    </section>
  );
}

/** Klasa karty listy w sekcjach profilu wsi. */
export const KARTA_LISTY_WIES =
  "karta-wow rounded-xl border border-stone-200/90 bg-white px-4 py-3 shadow-sm ring-1 ring-stone-900/[0.02]";
