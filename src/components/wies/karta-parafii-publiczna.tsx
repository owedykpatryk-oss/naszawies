import Link from "next/link";
import { RynekUdostepnijPrzycisk } from "@/components/wies/rynek-udostepnij-przycisk";
import { etykietaRodzajuWydarzenia } from "@/lib/wies/teksty-organizacji";
import type { ProfilParafiiJson } from "@/lib/wies/profil-organizacji";
import { ParafiaIntencjeTygodnia } from "@/components/wies/organizacja/parafia-intencje-tygodnia";

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

export type WydarzenieParafialneSkrot = {
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
    <div className="rounded-xl border border-violet-200/80 bg-white/90 p-4 shadow-sm">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-violet-950">
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

export function KartaParafiiPubliczna({
  parafia,
  sciezkaWydarzenia,
  sciezkaProfilu,
  linkKosciolNaMapie,
  linkCmentarzNaMapie,
  linkPlanCmentarza,
  nadchodzaceWydarzenia = [],
  trybOsadzony = false,
  sciezkaPelnejStrony,
}: {
  parafia: DaneParafiiPubliczne;
  sciezkaWydarzenia?: string;
  sciezkaProfilu?: string;
  linkKosciolNaMapie?: string | null;
  linkCmentarzNaMapie?: string | null;
  linkPlanCmentarza?: string | null;
  nadchodzaceWydarzenia?: WydarzenieParafialneSkrot[];
  trybOsadzony?: boolean;
  sciezkaPelnejStrony?: string;
}) {
  const p = parafia.profil;
  const wwwHref = linkZTekstu(p?.strona_www);
  const fbHref = linkZTekstu(p?.facebook);
  const kotwicaUdostepnij =
    sciezkaPelnejStrony ?? (sciezkaProfilu ? `${sciezkaProfilu}#parafia` : "#parafia");

  const tresc = (
    <>
      {!trybOsadzony ? (
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
          {fbHref ? (
            <a
              href={fbHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm font-medium text-violet-900 hover:bg-violet-50"
            >
              Facebook
            </a>
          ) : null}
          {sciezkaProfilu ? (
            <RynekUdostepnijPrzycisk
              url={kotwicaUdostepnij}
              tytul={parafia.name}
              tekst={`Msze i kontakt parafii — ${parafia.name}`}
            />
          ) : null}
        </div>
      </div>
      ) : null}

      {sciezkaPelnejStrony && !trybOsadzony ? (
        <div className="mb-4 flex justify-end">
          <Link
            href={sciezkaPelnejStrony}
            className="rounded-lg bg-violet-800 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-900"
          >
            Pełna strona parafii →
          </Link>
        </div>
      ) : null}

      {parafia.short_description ? (
        <p className="mt-4 text-sm leading-relaxed text-stone-700">{parafia.short_description}</p>
      ) : null}

      {(linkKosciolNaMapie || linkCmentarzNaMapie || linkPlanCmentarza) ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {linkKosciolNaMapie ? (
            <Link
              href={linkKosciolNaMapie}
              className="rounded-lg border border-violet-200 bg-violet-50/80 px-3 py-1.5 text-xs font-medium text-violet-900 hover:bg-violet-100"
            >
              ⛪ Kościół na mapie
            </Link>
          ) : null}
          {linkPlanCmentarza ? (
            <Link
              href={linkPlanCmentarza}
              className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-900 hover:bg-stone-100"
            >
              🗺 Plan cmentarza
            </Link>
          ) : null}
          {linkCmentarzNaMapie ? (
            <Link
              href={linkCmentarzNaMapie}
              className="rounded-lg border border-violet-200 bg-violet-50/80 px-3 py-1.5 text-xs font-medium text-violet-900 hover:bg-violet-100"
            >
              🪦 Cmentarz na mapie
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {p?.msze_niedziele || p?.msze_dni_powszednie ? (
          <div className="rounded-xl border border-violet-200/80 bg-white/90 p-4 shadow-sm sm:col-span-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-violet-950">
              <span aria-hidden>✝</span>
              Msze św.
            </h4>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {p?.msze_niedziele ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">Niedziele i święta</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{p.msze_niedziele}</p>
                </div>
              ) : null}
              {p?.msze_dni_powszednie ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">Dni powszednie</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{p.msze_dni_powszednie}</p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {p?.adres_kosciola || parafia.meeting_place ? (
          <Blok tytul="Kościół / miejsce" ikona="⛪">
            {p?.adres_kosciola ?? parafia.meeting_place}
            {p?.adres_kosciola && parafia.meeting_place && parafia.meeting_place !== p.adres_kosciola
              ? `\n\n${parafia.meeting_place}`
              : null}
          </Blok>
        ) : null}

        {p?.msze_niedziele && !(p?.msze_dni_powszednie) ? (
          <Blok tytul="Msze św. — niedziele i święta" ikona="✝">
            {p.msze_niedziele}
          </Blok>
        ) : null}

        {p?.msze_dni_powszednie && !(p?.msze_niedziele) ? (
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

        {p?.intencje_mszalne ? (
          <Blok tytul="Intencje mszalne" ikona="🕯">
            {p.intencje_mszalne}
          </Blok>
        ) : null}

        {p?.intencje_tygodniowe && p.intencje_tygodniowe.length > 0 ? (
          <div className="rounded-xl border border-violet-200/80 bg-white/90 p-4 shadow-sm sm:col-span-2">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-violet-950">
              <span aria-hidden>📋</span>
              Intencje mszalne — tydzień
            </h4>
            <div className="mt-3">
              <ParafiaIntencjeTygodnia intencje={p.intencje_tygodniowe} />
            </div>
          </div>
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

        {p?.info_cmentarz ? (
          <Blok tytul="Cmentarz parafialny" ikona="🪦">
            {p.info_cmentarz}
          </Blok>
        ) : null}
      </div>

      {nadchodzaceWydarzenia.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-800">Zbliżające się wydarzenia</h3>
          <ul className="mt-2 space-y-2">
            {nadchodzaceWydarzenia.slice(0, 4).map((ev) => (
              <li key={ev.id}>
                <Link
                  href={sciezkaWydarzenia ? `${sciezkaWydarzenia}/${ev.id}` : "#"}
                  className="block rounded-lg border border-violet-100 bg-white/80 px-3 py-2 text-sm transition hover:border-violet-300 hover:bg-violet-50/50"
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

      {(parafia.contact_phone || parafia.contact_email) && !p?.kancelaria ? (
        <p className="mt-3 text-xs text-stone-600">
          {parafia.contact_phone ? <>Tel. {parafia.contact_phone}</> : null}
          {parafia.contact_phone && parafia.contact_email ? " · " : null}
          {parafia.contact_email ? <>{parafia.contact_email}</> : null}
        </p>
      ) : null}

      {sciezkaWydarzenia ? (
        <p className="mt-4 text-sm">
          <Link
            href={`${sciezkaWydarzenia}?liturgia=1`}
            className="font-medium text-violet-800 underline hover:text-violet-950"
          >
            Kalendarz wydarzeń parafialnych →
          </Link>
        </p>
      ) : null}
    </>
  );

  if (trybOsadzony) return <div className="min-w-0">{tresc}</div>;

  return (
    <section
      id="parafia"
      className="scroll-mt-24 rounded-2xl border border-violet-300/60 bg-gradient-to-br from-violet-50/80 via-white to-indigo-50/40 p-5 shadow-sm sm:p-6"
    >
      {tresc}
    </section>
  );
}
