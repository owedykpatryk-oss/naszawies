import Link from "next/link";
import { RynekUdostepnijPrzycisk } from "@/components/wies/rynek-udostepnij-przycisk";
import { etykietaRodzajuWydarzenia } from "@/lib/wies/teksty-organizacji";
import type { ProfilOspJson } from "@/lib/wies/profil-organizacji";

export type DaneOspPubliczne = {
  id: string;
  name: string;
  short_description: string | null;
  meeting_place: string | null;
  schedule_text: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  profil: ProfilOspJson | null;
};

export type WydarzenieOspSkrot = {
  id: string;
  event_kind: string;
  title: string;
  location_text: string | null;
  starts_at: string;
};

function Blok({
  tytul,
  children,
  ikona,
}: {
  tytul: string;
  children: React.ReactNode;
  ikona?: string;
}) {
  return (
    <div className="rounded-xl border border-red-200/80 bg-white/90 p-4 shadow-sm">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-red-950">
        {ikona ? <span aria-hidden>{ikona}</span> : null}
        {tytul}
      </h4>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{children}</div>
    </div>
  );
}

function linkZTekstu(url: string | null | undefined): string | null {
  const www = url?.trim();
  if (!www) return null;
  return /^https?:\/\//i.test(www) ? www : `https://${www.replace(/^\/\//, "")}`;
}

export function KartaOspPubliczna({
  osp,
  sciezkaWydarzenia,
  sciezkaProfilu,
  linkRemizaNaMapie,
  linkPunktyWodyNaMapie,
  nadchodzaceWydarzenia = [],
}: {
  osp: DaneOspPubliczne;
  sciezkaWydarzenia?: string;
  sciezkaProfilu?: string;
  linkRemizaNaMapie?: string | null;
  linkPunktyWodyNaMapie?: string | null;
  nadchodzaceWydarzenia?: WydarzenieOspSkrot[];
}) {
  const p = osp.profil;
  const wwwHref = linkZTekstu(p?.strona_www);
  const fbHref = linkZTekstu(p?.facebook);
  const igHref = linkZTekstu(p?.instagram);
  const kotwicaUdostepnij = sciezkaProfilu ? `${sciezkaProfilu}#osp` : "#osp";

  return (
    <section
      id="osp"
      className="scroll-mt-24 rounded-2xl border border-red-400/50 bg-gradient-to-br from-red-50/80 via-white to-orange-50/40 p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-red-800">OSP / straż pożarna</p>
          <h2 className="mt-1 font-serif text-2xl text-red-950">{osp.name}</h2>
          {p?.numer_jednostki ? <p className="mt-0.5 text-xs text-stone-500">Nr jednostki: {p.numer_jednostki}</p> : null}
          {p?.naczelnik ? (
            <p className="mt-1 text-sm text-stone-700">
              <span className="font-medium">Naczelnik:</span> {p.naczelnik}
              {p.zastepca_naczelnika ? ` · zastępca: ${p.zastepca_naczelnika}` : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="tel:112"
            className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Alarm 112
          </a>
          {osp.contact_phone ? (
            <a
              href={`tel:${osp.contact_phone.replace(/\s/g, "")}`}
              className="rounded-lg bg-red-900 px-3 py-2 text-sm font-medium text-white hover:bg-red-950"
            >
              Straż (tel.)
            </a>
          ) : null}
          {osp.contact_email ? (
            <a
              href={`mailto:${osp.contact_email}`}
              className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-50"
            >
              E-mail
            </a>
          ) : null}
          {wwwHref ? (
            <a
              href={wwwHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-50"
            >
              Strona OSP
            </a>
          ) : null}
          {fbHref ? (
            <a
              href={fbHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-50"
            >
              Facebook
            </a>
          ) : null}
          {igHref ? (
            <a
              href={igHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-50"
            >
              Instagram
            </a>
          ) : null}
          {sciezkaProfilu ? (
            <RynekUdostepnijPrzycisk
              url={kotwicaUdostepnij}
              tytul={osp.name}
              tekst={`OSP — kontakt i ćwiczenia: ${osp.name}`}
            />
          ) : null}
        </div>
      </div>

      {osp.short_description ? (
        <p className="mt-4 text-sm leading-relaxed text-stone-700">{osp.short_description}</p>
      ) : null}

      {(linkRemizaNaMapie || linkPunktyWodyNaMapie) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {linkRemizaNaMapie ? (
            <Link
              href={linkRemizaNaMapie}
              className="inline-flex rounded-lg border border-red-200 bg-red-50/80 px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-100"
            >
              🚒 Remiza na mapie
            </Link>
          ) : null}
          {linkPunktyWodyNaMapie ? (
            <Link
              href={linkPunktyWodyNaMapie}
              className="inline-flex rounded-lg border border-red-200 bg-red-50/80 px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-100"
            >
              💧 Punkty czerpania wody
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {p?.siedziba_remizy || osp.meeting_place ? (
          <Blok tytul="Remiza / siedziba" ikona="🚒">
            {p?.siedziba_remizy ?? osp.meeting_place}
          </Blok>
        ) : null}

        {p?.cwiczenia ? (
          <Blok tytul="Ćwiczenia i szkolenia" ikona="🪖">
            {p.cwiczenia}
          </Blok>
        ) : null}

        {osp.schedule_text && !p?.cwiczenia ? (
          <Blok tytul="Terminy" ikona="📅">
            {osp.schedule_text}
          </Blok>
        ) : null}

        {p?.dyzury ? (
          <Blok tytul="Dyżury" ikona="🕐">
            {p.dyzury}
          </Blok>
        ) : null}

        {p?.rekrutacja ? (
          <Blok tytul="Jak dołączyć" ikona="🤝">
            {p.rekrutacja}
          </Blok>
        ) : null}

        {p?.zasady_bezpieczenstwa ? (
          <Blok tytul="Bezpieczeństwo pożarowe" ikona="🔥">
            {p.zasady_bezpieczenstwa}
          </Blok>
        ) : null}

        {p?.punkty_wody ? (
          <Blok tytul="Pobór wody (hydranty, zbiorniki)" ikona="💧">
            {p.punkty_wody}
          </Blok>
        ) : null}

        {p?.wsparcie_finansowe ? (
          <Blok tytul="Wsparcie jednostki" ikona="❤️">
            {p.wsparcie_finansowe}
          </Blok>
        ) : null}
      </div>

      {nadchodzaceWydarzenia.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-red-800">Zbliżające się wydarzenia</h3>
          <ul className="mt-2 space-y-2">
            {nadchodzaceWydarzenia.slice(0, 4).map((ev) => (
              <li key={ev.id}>
                <Link
                  href={sciezkaWydarzenia ? `${sciezkaWydarzenia}/${ev.id}` : "#"}
                  className="block rounded-lg border border-red-100 bg-white/80 px-3 py-2 text-sm transition hover:border-red-300 hover:bg-red-50/50"
                >
                  <p className="font-medium text-stone-900">{ev.title}</p>
                  <p className="mt-0.5 text-xs text-stone-600">
                    {etykietaRodzajuWydarzenia(ev.event_kind)} ·{" "}
                    {new Date(ev.starts_at).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" })}
                    {ev.location_text ? ` · ${ev.location_text}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {p?.uwagi ? (
        <p className="mt-4 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-xs text-amber-950">
          {p.uwagi}
        </p>
      ) : null}

      {sciezkaWydarzenia ? (
        <p className="mt-4 text-sm">
          <Link
            href={`${sciezkaWydarzenia}?osp=1`}
            className="font-medium text-red-800 underline hover:text-red-950"
          >
            Kalendarz ćwiczeń i wydarzeń OSP →
          </Link>
        </p>
      ) : null}
    </section>
  );
}
