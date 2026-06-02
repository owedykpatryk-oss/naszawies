import Link from "next/link";
import { motywOrganizacji } from "@/lib/wies/motyw-organizacji-publicznej";
import type { SegmentOrganizacji } from "@/lib/wies/sciezka-organizacji-publicznej";
import "@/components/wies/organizacja/organizacja-strona.css";

type Props = {
  segment: SegmentOrganizacji;
  nazwa: string;
  opis?: string | null;
  podpis?: string | null;
  haslo?: string | null;
  okladkaUrl?: string | null;
  href: string;
  badge?: string | null;
  badgePulsujacy?: boolean;
};

export function OrganizacjaTeaserKafel({
  segment,
  nazwa,
  opis,
  podpis,
  haslo,
  okladkaUrl,
  href,
  badge,
  badgePulsujacy = false,
}: Props) {
  const motyw = motywOrganizacji(segment);

  return (
    <Link
      href={href}
      className={`organizacja-teaser group relative flex min-h-[10.5rem] flex-col overflow-hidden rounded-2xl border bg-gradient-to-br shadow-sm ring-green-900/0 transition duration-300 hover:-translate-y-1.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-700/40 ${okladkaUrl ? "organizacja-teaser--okladka" : ""} ${motyw.heroGradient} ${motyw.heroBorder}`}
    >
      <span className="organizacja-teaser__polysk pointer-events-none absolute inset-0 z-[1]" aria-hidden />
      {okladkaUrl ? (
        <>
          <span className="organizacja-teaser__ribbon">Mini-strona</span>
          <div
            className="organizacja-teaser__okladka absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${okladkaUrl})` }}
            aria-hidden
          />
          <div className="organizacja-teaser__overlay absolute inset-0" aria-hidden />
        </>
      ) : (
        <>
          <div className="organizacja-teaser__wzork absolute inset-0" aria-hidden />
          <span
            className="organizacja-teaser__watermark pointer-events-none absolute -right-2 -top-3 select-none text-6xl opacity-[0.12]"
            aria-hidden
          >
            {motyw.ikona}
          </span>
        </>
      )}

      <div className="relative z-[2] flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs font-bold uppercase tracking-wider ${motyw.heroSubtext}`}>
            <span aria-hidden className="mr-1">
              {motyw.ikona}
            </span>
            {motyw.etykietaTypu}
          </p>
          {badge ? (
            <span
              className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold shadow-sm ${motyw.pill} ${badgePulsujacy ? "organizacja-badge-puls" : ""}`}
            >
              {badge}
            </span>
          ) : null}
        </div>

        <h3 className={`mt-2 font-serif text-lg leading-snug ${motyw.heroText}`}>{nazwa}</h3>

        {haslo ? (
          <p className={`mt-1 line-clamp-1 text-sm italic ${motyw.heroSubtext}`}>&ldquo;{haslo}&rdquo;</p>
        ) : null}

        {podpis ? <p className="mt-1 text-xs text-stone-600">{podpis}</p> : null}

        {opis ? <p className="mt-2 line-clamp-2 text-sm text-stone-700">{opis}</p> : null}

        <p
          className={`mt-auto flex items-center gap-1 pt-3 text-xs font-semibold ${motyw.heroSubtext} transition group-hover:gap-2`}
        >
          <span>Pełna strona</span>
          <span aria-hidden className="transition group-hover:translate-x-0.5">
            →
          </span>
        </p>
      </div>
    </Link>
  );
}
