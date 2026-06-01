type Props = {
  id?: string;
  etykieta?: string;
  tytul: string;
  opis?: string;
  className?: string;
  /** Wariant kolorystyczny (np. sekcja szkoły). */
  wariant?: "domyslny" | "szkola" | "sport";
};

/** Nagłówek sekcji na profilu wsi — spójna typografia i akcent motywu. */
export function TytulSekcjiWies({ id, etykieta, tytul, opis, className = "", wariant = "domyslny" }: Props) {
  const akcent = wariant === "szkola" || wariant === "sport";
  const etykietaKlasa = akcent
    ? wariant === "sport"
      ? "text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800/90"
      : "text-[10px] font-bold uppercase tracking-[0.18em] text-sky-800/90"
    : "wies-tytul-sekcji-etykieta text-[10px] font-bold uppercase tracking-[0.18em]";
  const tytulKlasa = akcent
    ? wariant === "sport"
      ? "font-serif text-xl text-emerald-950 sm:text-2xl"
      : "font-serif text-xl text-sky-950 sm:text-2xl"
    : "wies-tytul-sekcji-tytul font-serif text-xl sm:text-2xl";
  const liniaKlasa = akcent
    ? wariant === "sport"
      ? "mb-1.5 hidden h-px flex-1 max-w-[4rem] bg-gradient-to-r from-emerald-500/50 to-transparent sm:block"
      : "mb-1.5 hidden h-px flex-1 max-w-[4rem] bg-gradient-to-r from-sky-500/50 to-transparent sm:block"
    : "wies-tytul-sekcji-linia mb-1.5 hidden h-px flex-1 max-w-[4rem] sm:block";

  return (
    <header id={id} className={`scroll-mt-8 ${className}`}>
      {etykieta ? <p className={etykietaKlasa}>{etykieta}</p> : null}
      <div className="mt-1 flex items-end gap-3">
        <h2 className={tytulKlasa}>{tytul}</h2>
        <span className={liniaKlasa} aria-hidden />
      </div>
      {opis ? <p className="mt-2 max-w-prose text-sm leading-relaxed text-stone-600">{opis}</p> : null}
    </header>
  );
}
