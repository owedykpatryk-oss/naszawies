type Props = {
  urls: string[];
  tytul?: string;
  kompakt?: boolean;
};

/** Galeria zdjęć wpisu historii (zewnętrzne URL z R2 lub ręcznie). */
export function GaleriaZdjecHistorii({ urls, tytul, kompakt = false }: Props) {
  const lista = urls.filter((u) => u.startsWith("http")).slice(0, 8);
  if (lista.length === 0) return null;

  if (lista.length === 1) {
    return (
      <figure className={kompakt ? "mt-3" : "mt-4"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={lista[0]}
          alt={tytul ? `Zdjęcie: ${tytul}` : "Zdjęcie z kroniki"}
          className="max-h-72 w-full rounded-xl border border-stone-200 object-cover shadow-sm"
          loading="lazy"
        />
      </figure>
    );
  }

  return (
    <div
      className={`mt-3 grid gap-2 ${kompakt ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`}
      role="list"
      aria-label="Galeria zdjęć"
    >
      {lista.map((url, i) => (
        <figure key={url} role="listitem" className="overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
          {i === 0 && tytul ? (
            <figcaption className="sr-only">{tytul}</figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}
