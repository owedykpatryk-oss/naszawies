import Link from "next/link";
import type { ProfilKgwJson } from "@/lib/wies/profil-organizacji";

export type DaneKgwPubliczne = {
  id: string;
  name: string;
  short_description: string | null;
  meeting_place: string | null;
  schedule_text: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  profil: ProfilKgwJson | null;
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
    <div className="rounded-xl border border-rose-200/80 bg-white/90 p-4 shadow-sm">
      <h4 className="flex items-center gap-2 text-sm font-semibold text-rose-950">
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

export function KartaKgwPubliczna({
  kgw,
  sciezkaWydarzenia,
  sciezkaDotacje,
}: {
  kgw: DaneKgwPubliczne;
  sciezkaWydarzenia?: string;
  sciezkaDotacje?: string;
}) {
  const p = kgw.profil;
  const wwwHref = linkZTekstu(p?.strona_www);
  const fbHref = linkZTekstu(p?.facebook);

  return (
    <section
      id="kgw"
      className="scroll-mt-24 rounded-2xl border border-rose-300/60 bg-gradient-to-br from-rose-50/80 via-white to-fuchsia-50/30 p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-rose-800">Koło Gospodyń Wiejskich</p>
          <h2 className="mt-1 font-serif text-2xl text-rose-950">{kgw.name}</h2>
          {p?.przewodniczaca ? (
            <p className="mt-1 text-sm text-stone-700">
              <span className="font-medium">Przewodnicząca:</span> {p.przewodniczaca}
              {p.zastepczyni ? ` · zastępczyni: ${p.zastepczyni}` : ""}
            </p>
          ) : null}
          {p?.rok_zalozenia ? (
            <p className="mt-0.5 text-xs text-stone-500">Założone: {p.rok_zalozenia}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {kgw.contact_phone ? (
            <a
              href={`tel:${kgw.contact_phone.replace(/\s/g, "")}`}
              className="rounded-lg bg-rose-800 px-3 py-2 text-sm font-medium text-white hover:bg-rose-900"
            >
              Zadzwoń
            </a>
          ) : null}
          {kgw.contact_email ? (
            <a
              href={`mailto:${kgw.contact_email}`}
              className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-900 hover:bg-rose-50"
            >
              E-mail
            </a>
          ) : null}
          {wwwHref ? (
            <a
              href={wwwHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-900 hover:bg-rose-50"
            >
              Strona KGW
            </a>
          ) : null}
          {fbHref ? (
            <a
              href={fbHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-sm font-medium text-rose-900 hover:bg-rose-50"
            >
              Facebook
            </a>
          ) : null}
        </div>
      </div>

      {kgw.short_description ? (
        <p className="mt-4 text-sm leading-relaxed text-stone-700">{kgw.short_description}</p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {p?.miejsce_spotkan || kgw.meeting_place ? (
          <Blok tytul="Miejsce spotkań" ikona="🏡">
            {p?.miejsce_spotkan ?? kgw.meeting_place}
          </Blok>
        ) : null}

        {p?.zebrania ? (
          <Blok tytul="Zebrania i terminy" ikona="📅">
            {p.zebrania}
          </Blok>
        ) : null}

        {kgw.schedule_text && !p?.zebrania ? (
          <Blok tytul="Terminy" ikona="📅">
            {kgw.schedule_text}
          </Blok>
        ) : null}

        {p?.dzialalnosc ? (
          <Blok tytul="Działalność koła" ikona="🌾">
            {p.dzialalnosc}
          </Blok>
        ) : null}

        {p?.produkty_lokalne ? (
          <Blok tytul="Produkty i wyroby" ikona="🥟">
            {p.produkty_lokalne}
          </Blok>
        ) : null}

        {p?.jak_dolaczyc ? (
          <Blok tytul="Jak dołączyć" ikona="🤝">
            {p.jak_dolaczyc}
          </Blok>
        ) : null}

        {p?.wspolpraca_dotacje ? (
          <Blok tytul="Dotacje i projekty" ikona="💡">
            {p.wspolpraca_dotacje}
          </Blok>
        ) : null}
      </div>

      {p?.uwagi ? (
        <p className="mt-4 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-xs text-amber-950">
          {p.uwagi}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {sciezkaWydarzenia ? (
          <Link href={sciezkaWydarzenia} className="font-medium text-rose-800 underline hover:text-rose-950">
            Wydarzenia KGW →
          </Link>
        ) : null}
        {sciezkaDotacje ? (
          <Link href={sciezkaDotacje} className="font-medium text-rose-800 underline hover:text-rose-950">
            Źródła dofinansowania →
          </Link>
        ) : null}
      </div>
    </section>
  );
}
