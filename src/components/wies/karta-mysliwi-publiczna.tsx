import Link from "next/link";
import { RynekUdostepnijPrzycisk } from "@/components/wies/rynek-udostepnij-przycisk";
import { linkChroniony } from "@/lib/auth/sciezki-chronione";
import { etykietaRodzajuWydarzenia } from "@/lib/wies/teksty-organizacji";
import type { ProfilLowieckiJson } from "@/lib/wies/profil-organizacji";
import {
  ETYKIETA_RODZAJU_KALENDARZA,
  type WpisKalendarzaLowieckiego,
} from "@/lib/lowiectwo/kalendarz-lowiecki";

export type DaneMysliwiPubliczne = {
  id: string;
  name: string;
  short_description: string | null;
  meeting_place: string | null;
  schedule_text: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  profil: ProfilLowieckiJson | null;
};

export type WydarzenieLowieckieSkrot = {
  id: string;
  event_kind: string;
  title: string;
  location_text: string | null;
  starts_at: string;
};

export type OstrzezenieLowieckieSkrot = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  maObszarMapy: boolean;
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
    <div className="rounded-xl border border-amber-200/80 bg-white/90 p-4 shadow-sm">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-950">
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

export function KartaMysliwiPubliczna({
  kolo,
  maAktywneOstrzezenia = false,
  ostrzezenieAktywne = null,
  sciezkaWydarzenia,
  sciezkaProfilu,
  zalogowany = false,
  nadchodzaceWydarzenia = [],
  harmonogramLowiecki = [],
  mieszkaniecWsi = false,
  trybOsadzony = false,
  sciezkaPelnejStrony,
}: {
  kolo: DaneMysliwiPubliczne;
  maAktywneOstrzezenia?: boolean;
  ostrzezenieAktywne?: OstrzezenieLowieckieSkrot | null;
  sciezkaWydarzenia?: string;
  sciezkaProfilu?: string;
  zalogowany?: boolean;
  nadchodzaceWydarzenia?: WydarzenieLowieckieSkrot[];
  harmonogramLowiecki?: WpisKalendarzaLowieckiego[];
  mieszkaniecWsi?: boolean;
  trybOsadzony?: boolean;
  sciezkaPelnejStrony?: string;
}) {
  const p = kolo.profil;
  const wwwHref = linkZTekstu(p?.strona_www);
  const fbHref = linkZTekstu(p?.facebook);
  const igHref = linkZTekstu(p?.instagram);
  const kotwicaUdostepnij =
    sciezkaPelnejStrony ?? (sciezkaProfilu ? `${sciezkaProfilu}#mysliwi` : "#mysliwi");

  const tresc = (
    <>
      {!trybOsadzony ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">Koło łowieckie / myśliwi</p>
          <h2 className="mt-1 font-serif text-2xl text-emerald-950">{kolo.name}</h2>
          {p?.numer_kola ? <p className="mt-0.5 text-xs text-stone-500">Nr koła: {p.numer_kola}</p> : null}
          {p?.prezes || p?.lowczy ? (
            <p className="mt-1 text-sm text-stone-700">
              {p.prezes ? (
                <>
                  <span className="font-medium">Prezes:</span> {p.prezes}
                </>
              ) : null}
              {p.prezes && p.lowczy ? " · " : null}
              {p.lowczy ? (
                <>
                  <span className="font-medium">Łowczy:</span> {p.lowczy}
                </>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {kolo.contact_phone ? (
            <a
              href={`tel:${kolo.contact_phone.replace(/\s/g, "")}`}
              className="rounded-lg bg-emerald-900 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-950"
            >
              Zadzwoń
            </a>
          ) : null}
          {kolo.contact_email ? (
            <a
              href={`mailto:${kolo.contact_email}`}
              className="rounded-lg border border-emerald-700/40 bg-white px-3 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-50"
            >
              E-mail
            </a>
          ) : null}
          {wwwHref ? (
            <a
              href={wwwHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-emerald-700/40 bg-white px-3 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-50"
            >
              Strona koła
            </a>
          ) : null}
          {fbHref ? (
            <a
              href={fbHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-emerald-700/40 bg-white px-3 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-50"
            >
              Facebook
            </a>
          ) : null}
          {igHref ? (
            <a
              href={igHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-emerald-700/40 bg-white px-3 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-50"
            >
              Instagram
            </a>
          ) : null}
          {sciezkaProfilu ? (
            <RynekUdostepnijPrzycisk
              url={kotwicaUdostepnij}
              tytul={kolo.name}
              tekst={`Koło łowieckie — kontakt i bezpieczeństwo: ${kolo.name}`}
            />
          ) : null}
        </div>
      </div>
      ) : null}

      {sciezkaPelnejStrony && !trybOsadzony ? (
        <div className="mb-4 flex justify-end">
          <Link
            href={sciezkaPelnejStrony}
            className="rounded-lg bg-emerald-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-950"
          >
            Pełna strona koła →
          </Link>
        </div>
      ) : null}

      {maAktywneOstrzezenia ? (
        <div className="mt-4 rounded-lg border border-amber-400/70 bg-amber-100/80 px-3 py-2 text-sm text-amber-950">
          <p className="font-semibold">Aktywne ostrzeżenie polowania</p>
          {ostrzezenieAktywne ? (
            <p className="mt-1 text-xs">
              {ostrzezenieAktywne.title} ·{" "}
              {new Date(ostrzezenieAktywne.startsAt).toLocaleString("pl-PL", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {" – "}
              {new Date(ostrzezenieAktywne.endsAt).toLocaleString("pl-PL", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium">
            <a href="#ostrzezenia-lowieckie" className="underline hover:text-amber-900">
              Szczegóły ostrzeżenia ↓
            </a>
            {ostrzezenieAktywne?.maObszarMapy ? (
              <Link
                href={linkChroniony(
                  `/mapa?polowanie=${encodeURIComponent(ostrzezenieAktywne.id)}`,
                  zalogowany,
                )}
                className="underline hover:text-amber-900"
              >
                Obszar na mapie
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {kolo.short_description ? (
        <p className="mt-4 text-sm leading-relaxed text-stone-700">{kolo.short_description}</p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {p?.obszar_lowiecki ? (
          <Blok tytul="Obwód / rejon łowiecki" ikona="🌲">
            {p.obszar_lowiecki}
          </Blok>
        ) : null}

        {p?.siedziba_kola || kolo.meeting_place ? (
          <Blok tytul="Siedziba / miejsce spotkań" ikona="🏠">
            {p?.siedziba_kola ?? kolo.meeting_place}
          </Blok>
        ) : null}

        {p?.zebrania ? (
          <Blok tytul="Zebrania koła" ikona="📅">
            {p.zebrania}
          </Blok>
        ) : null}

        {kolo.schedule_text && !p?.zebrania ? (
          <Blok tytul="Terminy" ikona="📅">
            {kolo.schedule_text}
          </Blok>
        ) : null}

        {p?.sezon_lowiecki ? (
          <Blok tytul="Sezon łowiecki" ikona="🦌">
            {p.sezon_lowiecki}
          </Blok>
        ) : null}

        {p?.zasady_bezpieczenstwa ? (
          <Blok tytul="Bezpieczeństwo mieszkańców" ikona="⚠️">
            {p.zasady_bezpieczenstwa}
          </Blok>
        ) : null}

        {p?.zgloszenie_szkod ? (
          <Blok tytul="Szkody w uprawach — zgłoszenia" ikona="🌾">
            {p.zgloszenie_szkod}
          </Blok>
        ) : null}

        {p?.wspolpraca_rolnicy ? (
          <Blok tytul="Współpraca z rolnikami" ikona="🚜">
            {p.wspolpraca_rolnicy}
          </Blok>
        ) : null}

        {p?.kontakt_dla_mieszkancow ? (
          <Blok tytul="Kontakt dla mieszkańców" ikona="📞">
            {p.kontakt_dla_mieszkancow}
          </Blok>
        ) : null}
      </div>

      {harmonogramLowiecki.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Kalendarz łowiecki</h3>
          {!mieszkaniecWsi && zalogowany ? (
            <p className="mt-1 text-xs text-amber-800">
              Pełny plan ambony widzą mieszkańcy tej wsi po dołączeniu do społeczności.
            </p>
          ) : null}
          {!zalogowany ? (
            <p className="mt-1 text-xs text-stone-600">
              Zaloguj się jako mieszkaniec wsi, aby zobaczyć kto jest przydzielony na ambony.
            </p>
          ) : null}
          <ul className="mt-2 space-y-2">
            {harmonogramLowiecki.slice(0, 8).map((w) => (
              <li
                key={w.id}
                className="rounded-lg border border-amber-100 bg-white/80 px-3 py-2 text-sm"
              >
                <p className="font-medium text-stone-900">{w.title}</p>
                <p className="mt-0.5 text-xs text-stone-600">
                  {ETYKIETA_RODZAJU_KALENDARZA[w.entryKind]} ·{" "}
                  {new Date(w.startsAt).toLocaleString("pl-PL", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {w.entryKind === "obowiazek_ambony" && w.ambonaNazwa ? ` · ${w.ambonaNazwa}` : ""}
                  {mieszkaniecWsi && w.hunterName ? ` · ${w.hunterName}` : ""}
                  {mieszkaniecWsi && w.hunterPhone ? ` · ${w.hunterPhone}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {nadchodzaceWydarzenia.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Zbliżające się wydarzenia</h3>
          <ul className="mt-2 space-y-2">
            {nadchodzaceWydarzenia.slice(0, 4).map((ev) => (
              <li key={ev.id}>
                <Link
                  href={sciezkaWydarzenia ? `${sciezkaWydarzenia}/${ev.id}` : "#"}
                  className="block rounded-lg border border-emerald-100 bg-white/80 px-3 py-2 text-sm transition hover:border-emerald-300 hover:bg-emerald-50/50"
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

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <a href="#ostrzezenia-lowieckie" className="font-medium text-emerald-900 underline hover:text-emerald-950">
          Ostrzeżenia polowań →
        </a>
        {sciezkaWydarzenia ? (
          <Link
            href={`${sciezkaWydarzenia}?mysliwi=1`}
            className="font-medium text-emerald-900 underline hover:text-emerald-950"
          >
            Wydarzenia koła →
          </Link>
        ) : null}
      </div>
    </>
  );

  if (trybOsadzony) return <div className="min-w-0">{tresc}</div>;

  return (
    <section
      id="mysliwi"
      className="scroll-mt-24 rounded-2xl border border-emerald-800/30 bg-gradient-to-br from-emerald-50/70 via-white to-amber-50/40 p-5 shadow-sm sm:p-6"
    >
      {tresc}
    </section>
  );
}
