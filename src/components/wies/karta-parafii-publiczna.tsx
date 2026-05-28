import Link from "next/link";
import type { ProfilParafiiJson } from "@/lib/wies/profil-organizacji";

export type DaneParafiiPubliczne = {
  id: string;
  name: string;
  short_description: string | null;
  meeting_place: string | null;
  schedule_text: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  profil: ProfilParafiiJson | null;
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
    <div className="rounded-xl border border-violet-200/80 bg-white/90 p-4 shadow-sm">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-violet-950">
        {ikona ? <span aria-hidden>{ikona}</span> : null}
        {tytul}
      </h4>
      <div className="mt-2 text-sm leading-relaxed text-stone-700 whitespace-pre-wrap">{children}</div>
    </div>
  );
}

export function KartaParafiiPubliczna({
  parafia,
  sciezkaWydarzenia,
}: {
  parafia: DaneParafiiPubliczne;
  sciezkaWydarzenia?: string;
}) {
  const p = parafia.profil;
  const www = p?.strona_www?.trim();
  const wwwHref =
    www && /^https?:\/\//i.test(www) ? www : www ? `https://${www.replace(/^\/\//, "")}` : null;

  return (
    <section
      id="parafia"
      className="scroll-mt-24 rounded-2xl border border-violet-300/60 bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/40 p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet-800">Parafia / duszpasterstwo</p>
          <h2 className="mt-1 font-serif text-2xl text-violet-950">{parafia.name}</h2>
          {p?.proboszcz ? (
            <p className="mt-1 text-sm text-stone-700">
              <span className="font-medium">Proboszcz:</span> {p.proboszcz}
              {p.wikary ? ` · wikary: ${p.wikary}` : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {parafia.contact_phone ? (
            <a
              href={`tel:${parafia.contact_phone.replace(/\s/g, "")}`}
              className="rounded-lg bg-violet-800 px-3 py-2 text-sm font-medium text-white hover:bg-violet-900"
            >
              Zadzwoń
            </a>
          ) : null}
          {parafia.contact_email ? (
            <a
              href={`mailto:${parafia.contact_email}`}
              className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm font-medium text-violet-900 hover:bg-violet-50"
            >
              E-mail
            </a>
          ) : null}
          {wwwHref ? (
            <a
              href={wwwHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm font-medium text-violet-900 hover:bg-violet-50"
            >
              Strona parafii
            </a>
          ) : null}
        </div>
      </div>

      {parafia.short_description ? (
        <p className="mt-4 text-sm leading-relaxed text-stone-700">{parafia.short_description}</p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {p?.adres_kosciola || parafia.meeting_place ? (
          <Blok tytul="Kościół / miejsce" ikona="⛪">
            {p?.adres_kosciola ?? parafia.meeting_place}
            {p?.adres_kosciola && parafia.meeting_place && parafia.meeting_place !== p.adres_kosciola
              ? `\n\n${parafia.meeting_place}`
              : null}
          </Blok>
        ) : null}

        {p?.msze_niedziele ? (
          <Blok tytul="Msze św. — niedziele i święta" ikona="✝">
            {p.msze_niedziele}
          </Blok>
        ) : null}

        {p?.msze_dni_powszednie ? (
          <Blok tytul="Msze św. — dni powszednie" ikona="📅">
            {p.msze_dni_powszednie}
          </Blok>
        ) : null}

        {p?.spowiedz ? (
          <Blok tytul="Spowiedź św." ikona="🕊">
            {p.spowiedz}
          </Blok>
        ) : null}

        {p?.kancelaria ? (
          <Blok tytul="Kancelaria parafialna" ikona="🕐">
            {p.kancelaria}
          </Blok>
        ) : null}

        {parafia.schedule_text && !p?.kancelaria ? (
          <Blok tytul="Godziny / terminy" ikona="🕐">
            {parafia.schedule_text}
          </Blok>
        ) : null}

        {p?.sakramenty ? (
          <Blok tytul="Chrzty, śluby, pogrzeby" ikona="📋">
            {p.sakramenty}
          </Blok>
        ) : null}

        {p?.grupy_duszpasterskie ? (
          <Blok tytul="Grupy i wspólnoty" ikona="👥">
            {p.grupy_duszpasterskie}
          </Blok>
        ) : null}
      </div>

      {p?.uwagi ? (
        <p className="mt-4 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-xs text-amber-950">
          {p.uwagi}
        </p>
      ) : null}

      {(parafia.contact_phone || parafia.contact_email) && !p?.kancelaria ? (
        <p className="mt-3 text-xs text-stone-600">
          {parafia.contact_phone ? <>Tel. {parafia.contact_phone}</> : null}
          {parafia.contact_phone && parafia.contact_email ? " · " : null}
          {parafia.contact_email ? <>{parafia.contact_email}</> : null}
        </p>
      ) : null}

      {sciezkaWydarzenia ? (
        <p className="mt-4 text-sm">
          <Link href={sciezkaWydarzenia} className="font-medium text-violet-800 underline hover:text-violet-950">
            Kalendarz wydarzeń parafialnych →
          </Link>
        </p>
      ) : null}
    </section>
  );
}
