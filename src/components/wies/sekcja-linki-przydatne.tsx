import {
  ETYKIETY_KATEGORII_LINKOW,
  GRUPY_KATEGORII,
  pogrupujLinkiPrzydatne,
  type LinkPrzydatnyPubliczny,
} from "@/lib/wies/linki-przydatne";

function KartaLinku({ l }: { l: LinkPrzydatnyPubliczny }) {
  const meta = ETYKIETY_KATEGORII_LINKOW[l.category];
  return (
    <li className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">{meta.label}</p>
      <p className="mt-1 font-medium text-stone-900">{l.title}</p>
      {l.note?.trim() ? <p className="mt-2 text-xs leading-relaxed text-stone-600">{l.note.trim()}</p> : null}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {l.url?.trim() ? (
          <a href={l.url.trim()} target="_blank" rel="noopener noreferrer" className="font-medium text-green-800 underline">
            Otwórz stronę →
          </a>
        ) : null}
        {l.phone?.trim() ? (
          <a href={`tel:${l.phone.replace(/\s/g, "")}`} className="text-stone-800">
            Tel. {l.phone.trim()}
          </a>
        ) : null}
        {l.email?.trim() ? (
          <a href={`mailto:${l.email.trim()}`} className="text-stone-800 underline">
            {l.email.trim()}
          </a>
        ) : null}
      </div>
    </li>
  );
}

export function SekcjaLinkiPrzydatne({
  linki,
  nazwaGminy,
}: {
  linki: LinkPrzydatnyPubliczny[];
  nazwaGminy: string;
}) {
  if (linki.length === 0) {
    return (
      <section id="sekcja-linki-przydatne" className="mt-8 scroll-mt-6">
        <h2 className="font-serif text-xl text-green-950">Przydatne linki i numery</h2>
        <p className="mt-2 text-sm text-stone-600">
          Sołtys może dodać tu BIP gminy {nazwaGminy}, lokalną gazetę, radio, profile w mediach społecznościowych oraz
          numery telefonów do urzędu i pomocy — pojawią się w tym miejscu.
        </p>
      </section>
    );
  }

  const pogrupowane = pogrupujLinkiPrzydatne(linki);

  return (
    <section id="sekcja-linki-przydatne" className="mt-8 scroll-mt-6">
      <h2 className="font-serif text-xl text-green-950">Przydatne linki i numery</h2>
      <p className="mt-1 text-sm text-stone-600">
        Urząd, media lokalne i inne adresy zebrane dla mieszkańców — uzupełniane przez sołtysa. Linki otwierają się w
        nowej karcie.
      </p>
      <div className="mt-6 space-y-8">
        {GRUPY_KATEGORII.map((grupa) => {
          const lista = pogrupowane[grupa.id];
          if (lista.length === 0) return null;
          return (
            <div key={grupa.id}>
              <h3 className="text-sm font-semibold text-green-950">{grupa.tytul}</h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">{lista.map((l) => <KartaLinku key={l.id} l={l} />)}</ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
