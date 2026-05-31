type Props = {
  etykieta?: string;
  tytul: string;
  opis?: string;
  /** Wariant kolorystyczny hero */
  wariant?: "szukaj" | "domyslny";
  dzieci?: React.ReactNode;
};

/** Spójny hero modułów publicznych (szukaj, pomoc, kontakt…). */
export function HeroModuluPublicznego({ etykieta, tytul, opis, wariant = "domyslny", dzieci }: Props) {
  const klasyWariant =
    wariant === "szukaj" ? "hero-publiczny hero-publiczny--szukaj border-emerald-300/40" : "hero-publiczny border-stone-200/80 bg-gradient-to-br from-white via-white to-emerald-50/30";

  return (
    <header className={klasyWariant}>
      <div className="relative z-[1]">
        {etykieta ? <p className="etykieta-modulu">{etykieta}</p> : null}
        <h1 className="mt-1 font-serif text-[clamp(1.75rem,4vw,2.5rem)] leading-tight tracking-tight text-green-950">
          {tytul}
        </h1>
        {opis ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">{opis}</p> : null}
        {dzieci ? <div className="mt-4">{dzieci}</div> : null}
      </div>
    </header>
  );
}
