import Link from "next/link";
import type { ProfilKlubuSportowegoJson } from "@/lib/wies/profil-klubu-sportowego";
import { etykietaRodzajuWydarzenia } from "@/lib/wies/teksty-organizacji";

export type DaneKlubuSportowego = {
  id: string;
  name: string;
  short_description: string | null;
  meeting_place: string | null;
  schedule_text: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  profil?: ProfilKlubuSportowegoJson | null;
};

function linkZTekstu(url: string | null | undefined): string | null {
  const www = url?.trim();
  if (!www) return null;
  return /^https?:\/\//i.test(www) ? www : `https://${www.replace(/^\/\//, "")}`;
}

export type WydarzenieSportoweSkrot = {
  id: string;
  event_kind: string;
  title: string;
  location_text: string | null;
  starts_at: string;
};

export function KartaKlubuSportowego({
  klub,
  sciezkaWydarzenia,
  sciezkaProfilu,
  nadchodzaceWydarzenia = [],
  linkBoiskoNaMapie = null,
  trybOsadzony = false,
  sciezkaPelnejStrony,
}: {
  klub: DaneKlubuSportowego;
  sciezkaWydarzenia: string;
  sciezkaProfilu: string;
  nadchodzaceWydarzenia?: WydarzenieSportoweSkrot[];
  linkBoiskoNaMapie?: string | null;
  trybOsadzony?: boolean;
  sciezkaPelnejStrony?: string;
}) {
  const p = klub.profil ?? null;
  const wwwHref = linkZTekstu(p?.strona_www);
  const fbHref = linkZTekstu(p?.facebook);
  const igHref = linkZTekstu(p?.instagram);

  const tresc = (
    <>
      {!trybOsadzony ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">Klub / sekcja</p>
          <h3 className="mt-1 font-serif text-xl text-green-950">{klub.name}</h3>
        </>
      ) : null}
      {p?.dyscyplina ? <p className={`text-sm font-medium text-emerald-800 ${trybOsadzony ? "" : "mt-1"}`}>{p.dyscyplina}</p> : null}
      {klub.short_description ? <p className="mt-2 text-sm text-stone-700">{klub.short_description}</p> : null}
      {p?.trener ? (
        <p className="mt-2 text-sm text-stone-700">
          <span className="font-medium text-stone-800">Trener:</span> {p.trener}
        </p>
      ) : null}
      <dl className="mt-4 space-y-2 text-sm text-stone-700">
        {klub.meeting_place ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Baza / boisko</dt>
            <dd>
              {klub.meeting_place}
              {linkBoiskoNaMapie ? (
                <>
                  {" "}
                  ·{" "}
                  <Link href={linkBoiskoNaMapie} className="text-green-800 underline">
                    Mapa ↗
                  </Link>
                </>
              ) : null}
            </dd>
          </div>
        ) : null}
        {p?.rekrutacja ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Rekrutacja</dt>
            <dd className="whitespace-pre-wrap">{p.rekrutacja}</dd>
          </div>
        ) : null}
        {p?.skladka ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Składki</dt>
            <dd>{p.skladka}</dd>
          </div>
        ) : null}
        {wwwHref || fbHref || igHref ? (
          <div className="flex flex-wrap gap-3 pt-1">
            {wwwHref ? (
              <a href={wwwHref} className="text-sm font-medium text-green-800 underline" target="_blank" rel="noopener noreferrer">
                Strona klubu ↗
              </a>
            ) : null}
            {fbHref ? (
              <a href={fbHref} className="text-sm font-medium text-green-800 underline" target="_blank" rel="noopener noreferrer">
                Facebook ↗
              </a>
            ) : null}
            {igHref ? (
              <a href={igHref} className="text-sm font-medium text-green-800 underline" target="_blank" rel="noopener noreferrer">
                Instagram ↗
              </a>
            ) : null}
          </div>
        ) : null}
        {klub.schedule_text ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Stałe terminy (opis)</dt>
            <dd className="whitespace-pre-wrap">{klub.schedule_text}</dd>
          </div>
        ) : null}
        {klub.contact_phone ? (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">Kontakt</dt>
            <dd>
              <a href={`tel:${klub.contact_phone.replace(/\s/g, "")}`} className="font-medium text-green-800 underline">
                {klub.contact_phone}
              </a>
              {klub.contact_email ? (
                <>
                  {" · "}
                  <a href={`mailto:${klub.contact_email}`} className="text-green-800 underline">
                    {klub.contact_email}
                  </a>
                </>
              ) : null}
            </dd>
          </div>
        ) : null}
      </dl>

      {nadchodzaceWydarzenia.length > 0 ? (
        <div className="mt-5">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Najbliższe mecze i treningi</h4>
          <ul className="mt-2 space-y-2">
            {nadchodzaceWydarzenia.map((ev) => (
              <li key={ev.id}>
                <Link
                  href={`${sciezkaProfilu}/wydarzenia/${ev.id}`}
                  className="block rounded-lg border border-sky-200/80 bg-white/90 px-3 py-2 text-sm hover:border-sky-400 hover:bg-sky-50/50"
                >
                  <span className="font-medium text-stone-900">{ev.title}</span>
                  <span className="mt-0.5 block text-xs text-stone-600">
                    {etykietaRodzajuWydarzenia(ev.event_kind)} ·{" "}
                    {new Date(ev.starts_at).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" })}
                    {ev.location_text ? ` · ${ev.location_text}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href={`${sciezkaWydarzenia}?sport=1`} className="mt-2 inline-block text-xs font-medium text-green-800 underline">
            Pełny kalendarz sportowy →
          </Link>
        </div>
      ) : null}
    </>
  );

  if (trybOsadzony) {
    return <div className="min-w-0 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">{tresc}</div>;
  }

  return (
    <section className="rounded-2xl border border-sky-300/60 bg-gradient-to-br from-sky-50/90 via-white to-emerald-50/30 p-5 shadow-sm sm:p-6">
      {tresc}
      {sciezkaPelnejStrony ? (
        <p className="mt-4">
          <Link href={sciezkaPelnejStrony} className="text-sm font-semibold text-sky-900 underline hover:text-sky-950">
            Pełna strona klubu →
          </Link>
        </p>
      ) : null}
    </section>
  );
}
