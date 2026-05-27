type Props = {
  id?: string;
  etykieta?: string;
  tytul: string;
  opis?: string;
  className?: string;
};

/** Nagłówek sekcji na profilu wsi — spójna typografia i akcent. */
export function TytulSekcjiWies({ id, etykieta, tytul, opis, className = "" }: Props) {
  return (
    <header id={id} className={`scroll-mt-8 ${className}`}>
      {etykieta ? (
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-800/85">{etykieta}</p>
      ) : null}
      <div className="mt-1 flex items-end gap-3">
        <h2 className="font-serif text-xl text-green-950 sm:text-2xl">{tytul}</h2>
        <span className="mb-1.5 hidden h-px flex-1 max-w-[4rem] bg-gradient-to-r from-emerald-600/50 to-transparent sm:block" aria-hidden />
      </div>
      {opis ? <p className="mt-2 max-w-prose text-sm leading-relaxed text-stone-600">{opis}</p> : null}
    </header>
  );
}
