import {
  ETYKIETY_KATEGORII_LINKOW,
  GRUPY_KATEGORII,
  pogrupujLinkiPrzydatne,
  type LinkPrzydatnyPubliczny,
} from "@/lib/wies/linki-przydatne";
import { IkonaKategoriiLinku, klasaRamkiGrupyLinkow } from "@/components/wies/wizual-kategoria-linku";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";

function KartaLinku({ l }: { l: LinkPrzydatnyPubliczny }) {
  const meta = ETYKIETY_KATEGORII_LINKOW[l.category];
  const ramka = klasaRamkiGrupyLinkow(meta.grupa);

  return (
    <li
      className={`karta-wow flex gap-3 rounded-xl border border-stone-200/90 bg-white py-3 pl-3 pr-4 shadow-sm ring-1 ring-stone-900/[0.02] border-l-[3px] ${ramka}`}
    >
      <IkonaKategoriiLinku category={l.category} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-500">{meta.label}</p>
        <p className="mt-0.5 font-medium text-stone-900">{l.title}</p>
        {l.note?.trim() ? <p className="mt-2 text-xs leading-relaxed text-stone-600">{l.note.trim()}</p> : null}
        <div className="mt-2.5 flex flex-wrap gap-2">
          {l.url?.trim() ? (
            <a
              href={l.url.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200/60 transition hover:bg-emerald-100"
            >
              Strona →
            </a>
          ) : null}
          {l.phone?.trim() ? (
            <a
              href={`tel:${l.phone.replace(/\s/g, "")}`}
              className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-800 ring-1 ring-stone-200/80"
            >
              {l.phone.trim()}
            </a>
          ) : null}
          {l.email?.trim() ? (
            <a
              href={`mailto:${l.email.trim()}`}
              className="inline-flex max-w-full truncate rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-800 ring-1 ring-stone-200/80 underline-offset-2 hover:underline"
            >
              {l.email.trim()}
            </a>
          ) : null}
        </div>
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
      <section id="sekcja-linki-przydatne" className="sekcja-poza-foldem mt-8 scroll-mt-6">
        <TytulSekcjiWies
          tytul="Przydatne linki i numery"
          opis={`Sołtys może dodać tu BIP gminy ${nazwaGminy}, lokalną gazetę, radio i numery telefonów — pojawią się w tym miejscu.`}
        />
        <div className="mt-4 rounded-2xl border border-dashed border-stone-300/90 bg-stone-50/80 px-5 py-8 text-center">
          <p className="text-sm font-medium text-stone-700">Jeszcze brak wpisów</p>
          <p className="mt-1 text-xs text-stone-500">Wkrótce mogą pojawić się linki do urzędu i mediów lokalnych.</p>
        </div>
      </section>
    );
  }

  const pogrupowane = pogrupujLinkiPrzydatne(linki);

  return (
    <section id="sekcja-linki-przydatne" className="sekcja-poza-foldem mt-8 scroll-mt-6">
      <TytulSekcjiWies
        etykieta="Na skróty"
        tytul="Przydatne linki i numery"
        opis="Urząd, media lokalne i inne adresy zebrane dla mieszkańców — uzupełniane przez sołtysa."
      />
      <div className="mt-6 space-y-8">
        {GRUPY_KATEGORII.map((grupa) => {
          const lista = pogrupowane[grupa.id];
          if (lista.length === 0) return null;
          return (
            <div key={grupa.id}>
              <h3 className="inline-flex items-center gap-2 rounded-full bg-stone-100/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-950 ring-1 ring-stone-200/80">
                <span className={`h-1.5 w-1.5 rounded-full ${grupa.id === "urzad" ? "bg-emerald-500" : grupa.id === "media" ? "bg-sky-500" : grupa.id === "pomoc" ? "bg-amber-500" : "bg-stone-400"}`} />
                {grupa.tytul}
                <span className="font-normal normal-case text-stone-500">({lista.length})</span>
              </h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">{lista.map((l) => <KartaLinku key={l.id} l={l} />)}</ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
