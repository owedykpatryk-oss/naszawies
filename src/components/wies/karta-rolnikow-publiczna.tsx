import Link from "next/link";
import type { ProfilRolnikowJson } from "@/lib/wies/profil-organizacji";

export type DaneRolnikowPubliczne = {
  id: string;
  name: string;
  short_description: string | null;
  meeting_place: string | null;
  schedule_text: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  profil: ProfilRolnikowJson | null;
};

function Blok({ tytul, children, ikona }: { tytul: string; children: React.ReactNode; ikona?: string }) {
  return (
    <div className="rounded-xl border border-lime-200/80 bg-white/95 p-4 shadow-sm ring-1 ring-lime-100/60">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-lime-950">
        {ikona ? <span aria-hidden>{ikona}</span> : null}
        {tytul}
      </h4>
      <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{children}</div>
    </div>
  );
}

export function KartaRolnikowPubliczna({
  kolo,
  linkNaMapie,
  sciezkaRolnictwa,
}: {
  kolo: DaneRolnikowPubliczne;
  linkNaMapie?: string | null;
  sciezkaRolnictwa?: string | null;
}) {
  const p = kolo.profil;

  return (
    <div className="wies-karta-rolnikow rounded-2xl border border-lime-200/80 bg-gradient-to-br from-lime-50/50 via-white to-amber-50/20 p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-lime-800">Koło rolników</p>
          <h3 className="mt-1 font-serif text-2xl text-lime-950">{kolo.name}</h3>
          {p?.przewodniczacy ? (
            <p className="mt-1 text-sm text-stone-700">
              <span className="font-medium">Przewodniczący:</span> {p.przewodniczacy}
            </p>
          ) : null}
          {kolo.short_description ? (
            <p className="mt-2 max-w-prose text-sm text-stone-600">{kolo.short_description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {kolo.contact_phone ? (
            <a
              href={`tel:${kolo.contact_phone.replace(/\s/g, "")}`}
              className="rounded-lg bg-lime-800 px-3 py-2 text-sm font-medium text-white hover:bg-lime-900"
            >
              Zadzwoń
            </a>
          ) : null}
          {kolo.contact_email ? (
            <a
              href={`mailto:${kolo.contact_email}`}
              className="rounded-lg border border-lime-300 bg-white px-3 py-2 text-sm font-medium text-lime-900 hover:bg-lime-50"
            >
              E-mail
            </a>
          ) : null}
          {linkNaMapie ? (
            <Link
              href={linkNaMapie}
              className="rounded-lg border border-lime-300 bg-white px-3 py-2 text-sm font-medium text-lime-900 hover:bg-lime-50"
            >
              Mapa
            </Link>
          ) : null}
          {sciezkaRolnictwa ? (
            <Link
              href={sciezkaRolnictwa}
              className="rounded-lg border border-lime-300 bg-lime-50 px-3 py-2 text-sm font-medium text-lime-900 hover:bg-lime-100"
            >
              Profil wsi
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {p?.miejsce_spotkan || kolo.meeting_place ? (
          <Blok tytul="Miejsce spotkań" ikona="📍">
            {p?.miejsce_spotkan || kolo.meeting_place}
          </Blok>
        ) : null}
        {p?.zebrania || kolo.schedule_text ? (
          <Blok tytul="Zebrania" ikona="🕐">
            {p?.zebrania || kolo.schedule_text}
          </Blok>
        ) : null}
        {p?.dzialalnosc ? <Blok tytul="Działalność" ikona="🌾">{p.dzialalnosc}</Blok> : null}
        {p?.wspolpraca_arimr ? <Blok tytul="ARiMR / dopłaty" ikona="📋">{p.wspolpraca_arimr}</Blok> : null}
        {p?.jak_dolaczyc ? <Blok tytul="Jak dołączyć" ikona="🤝">{p.jak_dolaczyc}</Blok> : null}
      </div>

      {p?.uwagi ? (
        <p className="mt-4 rounded-xl border border-lime-100 bg-lime-50/80 px-4 py-3 text-sm text-stone-700">{p.uwagi}</p>
      ) : null}
    </div>
  );
}
