import Link from "next/link";
import { motywOrganizacji } from "@/lib/wies/motyw-organizacji-publicznej";
import "@/components/wies/organizacja/organizacja-strona.css";
import type { SegmentOrganizacji } from "@/lib/wies/sciezka-organizacji-publicznej";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { etykietaRodzajuWydarzenia } from "@/lib/wies/teksty-organizacji";

type WiesPubliczna = {
  name: string;
  voivodeship: string;
  county: string;
  commune: string;
  slug: string;
};

type WydarzeniePubliczne = {
  id: string;
  title: string;
  description: string | null;
  location_text: string | null;
  starts_at: string;
  ends_at: string | null;
  event_kind: string;
};

type Props = {
  wies: WiesPubliczna;
  wydarzenie: WydarzeniePubliczne;
  sciezkaWydarzenia: string;
  siteUrl: string;
  nazwaGrupy?: string | null;
  sciezkaOrganizacji?: string | null;
  segmentOrganizacji?: SegmentOrganizacji | null;
};

function formatIsoDoKalendarza(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function linkGoogleCalendar(wydarzenie: WydarzeniePubliczne, sciezkaPelna: string): string {
  const start = new Date(wydarzenie.starts_at);
  const end = wydarzenie.ends_at
    ? new Date(wydarzenie.ends_at)
    : new Date(start.getTime() + 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: wydarzenie.title,
    dates: `${formatIsoDoKalendarza(start)}/${formatIsoDoKalendarza(end)}`,
  });
  if (wydarzenie.location_text) params.set("location", wydarzenie.location_text);
  const opis = [wydarzenie.description, sciezkaPelna].filter(Boolean).join("\n\n");
  if (opis) params.set("details", opis.slice(0, 800));
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function WydarzenieJsonLd({
  wies,
  wydarzenie,
  sciezkaWydarzenia,
  siteUrl,
  nazwaGrupy,
  sciezkaOrganizacji,
}: Props) {
  const baza = siteUrl.replace(/\/$/, "");
  const urlPelny = `${baza}${sciezkaWydarzenia}`;
  const sciezkaWsi = sciezkaProfiluWsi(wies);

  const event: Record<string, unknown> = {
    "@type": "Event",
    "@id": `${urlPelny}#event`,
    name: wydarzenie.title,
    startDate: wydarzenie.starts_at,
    ...(wydarzenie.ends_at ? { endDate: wydarzenie.ends_at } : {}),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url: urlPelny,
    inLanguage: "pl-PL",
    ...(wydarzenie.description ? { description: wydarzenie.description } : {}),
    location: {
      "@type": "Place",
      name: wydarzenie.location_text ?? wies.name,
      address: {
        "@type": "PostalAddress",
        addressLocality: wies.name,
        addressRegion: wies.voivodeship,
        addressCountry: "PL",
      },
    },
    organizer: sciezkaOrganizacji
      ? {
          "@type": "Organization",
          name: nazwaGrupy ?? "Organizacja lokalna",
          url: `${baza}${sciezkaOrganizacji}`,
        }
      : {
          "@type": "Organization",
          name: nazwaGrupy ?? wies.name,
          url: `${baza}${sciezkaWsi}`,
        },
  };

  const payload = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: wies.name, item: `${baza}${sciezkaWsi}` },
          {
            "@type": "ListItem",
            position: 2,
            name: "Kalendarz wydarzeń",
            item: `${baza}${sciezkaWsi}/wydarzenia`,
          },
          { "@type": "ListItem", position: 3, name: wydarzenie.title, item: urlPelny },
        ],
      },
      event,
    ],
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

export function WydarzenieStronaPubliczna({
  wies,
  wydarzenie,
  sciezkaWydarzenia,
  sciezkaWsi,
  siteUrl,
  nazwaGrupy,
  sciezkaOrganizacji,
  segmentOrganizacji,
}: Props & { sciezkaWsi: string }) {
  const data = new Date(wydarzenie.starts_at);
  const koniec = wydarzenie.ends_at ? new Date(wydarzenie.ends_at) : null;
  const motyw = segmentOrganizacji ? motywOrganizacji(segmentOrganizacji) : null;
  const urlPelny = `${siteUrl.replace(/\/$/, "")}${sciezkaWydarzenia}`;
  const linkKalendarz = linkGoogleCalendar(wydarzenie, urlPelny);

  return (
    <>
      <WydarzenieJsonLd
        wies={wies}
        wydarzenie={wydarzenie}
        sciezkaWydarzenia={sciezkaWydarzenia}
        siteUrl={siteUrl}
        nazwaGrupy={nazwaGrupy}
        sciezkaOrganizacji={sciezkaOrganizacji}
        segmentOrganizacji={segmentOrganizacji}
      />

      <nav className="organizacja-breadcrumb mb-4" aria-label="Nawigacja">
        <Link href={sciezkaWsi} className="organizacja-breadcrumb__link">
          {wies.name}
        </Link>
        <span className="organizacja-breadcrumb__sep" aria-hidden>
          /
        </span>
        <Link href={`${sciezkaWsi}/wydarzenia`} className="organizacja-breadcrumb__link">
          Kalendarz
        </Link>
        <span className="organizacja-breadcrumb__sep" aria-hidden>
          /
        </span>
        <span className="organizacja-breadcrumb__chip">Wydarzenie</span>
      </nav>

      <article className="wydarzenie-wow wow-wejscie overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-lg ring-1 ring-stone-900/[0.03]">
        <header
          className={`wydarzenie-wow__hero relative overflow-hidden border-b px-5 py-6 sm:px-8 ${
            motyw ? `bg-gradient-to-br ${motyw.heroGradient}` : "bg-gradient-to-br from-indigo-50/80 via-white to-stone-50"
          }`}
        >
          <div className="wydarzenie-wow__ambient pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative flex flex-wrap items-start gap-4">
            <div
              className="wydarzenie-wow__data flex shrink-0 flex-col items-center justify-center rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-center shadow-md ring-1 ring-stone-900/[0.04]"
              aria-hidden
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                {data.toLocaleDateString("pl-PL", { month: "short" })}
              </span>
              <span className="font-serif text-2xl leading-none text-green-950">{data.getDate()}</span>
              <span className="text-[10px] text-stone-600">{data.toLocaleDateString("pl-PL", { weekday: "short" })}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-800">
                {etykietaRodzajuWydarzenia(wydarzenie.event_kind)}
              </p>
              <h1 className="mt-1 font-serif text-2xl text-green-950 sm:text-3xl">{wydarzenie.title}</h1>
              <p className="mt-2 text-sm text-stone-700">
                <time dateTime={wydarzenie.starts_at}>
                  {data.toLocaleString("pl-PL", { dateStyle: "full", timeStyle: "short" })}
                </time>
                {koniec ? (
                  <>
                    {" — "}
                    <time dateTime={wydarzenie.ends_at!}>
                      {koniec.toLocaleTimeString("pl-PL", { timeStyle: "short" })}
                    </time>
                  </>
                ) : null}
              </p>
              {wydarzenie.location_text ? (
                <p className="mt-1 text-sm text-stone-600">📍 {wydarzenie.location_text}</p>
              ) : null}
              {nazwaGrupy ? (
                <p className="mt-2 text-sm text-stone-600">
                  {sciezkaOrganizacji ? (
                    <Link href={sciezkaOrganizacji} className="font-semibold text-green-800 underline">
                      {nazwaGrupy} →
                    </Link>
                  ) : (
                    <span>{nazwaGrupy}</span>
                  )}
                </p>
              ) : null}
            </div>
          </div>
        </header>

        <div className="space-y-5 px-5 py-6 sm:px-8">
          {wydarzenie.description ? (
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-stone-800">{wydarzenie.description}</div>
          ) : (
            <p className="text-sm text-stone-500">Szczegóły wydarzenia zostaną uzupełnione przez organizatora.</p>
          )}

          <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4">
            <a
              href={linkKalendarz}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 transition hover:border-green-300 hover:bg-green-50"
            >
              📅 Dodaj do Google Calendar
            </a>
            {sciezkaOrganizacji ? (
              <Link
                href={sciezkaOrganizacji}
                className="inline-flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-900 transition hover:bg-green-100"
              >
                {motyw?.ikona ?? "🏛"} Strona organizacji
              </Link>
            ) : null}
            <Link
              href={`${sciezkaWsi}/wydarzenia`}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              ← Pełny kalendarz
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
