import Link from "next/link";
import type { RynekOfertaPubliczna } from "@/components/wies/marketplace-lista-klient";
import {
  BlokInfoRynku,
  KartaOgloszeniaRynek,
  OdznakaZweryfikowany,
} from "@/components/wies/rynek-ui";

export type ProfilUslugPelny = {
  id: string;
  business_name: string;
  short_description: string | null;
  details: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  categories: string[] | null;
  service_area: string | null;
  is_verified: boolean;
};

export function RynekProfilUslugPubliczny({
  profil,
  ogloszenia,
  sciezkaWsi,
}: {
  profil: ProfilUslugPelny;
  ogloszenia: RynekOfertaPubliczna[];
  sciezkaWsi: string;
}) {
  const www = profil.website?.trim();
  const wwwHref = www ? (/^https?:\/\//i.test(www) ? www : `https://${www.replace(/^\/\//, "")}`) : null;
  const kategorie = profil.categories ?? [];

  return (
    <article className="overflow-hidden rounded-2xl border border-orange-200/80 bg-white shadow-sm">
      <header className="border-b border-orange-100 bg-gradient-to-br from-orange-50/90 via-amber-50/40 to-white p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-orange-900">Profil usługodawcy</p>
        <div className="mt-2 flex flex-wrap items-start gap-2">
          <h1 className="font-serif text-2xl text-green-950 sm:text-3xl">{profil.business_name}</h1>
          {profil.is_verified ? <OdznakaZweryfikowany duza /> : null}
        </div>
        {profil.short_description ? (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-700">{profil.short_description}</p>
        ) : null}
        {kategorie.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {kategorie.map((k) => (
              <li key={k} className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs text-stone-700 ring-1 ring-orange-200">
                {k}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          {profil.phone ? (
            <a
              href={`tel:${profil.phone.replace(/\s/g, "")}`}
              className="rounded-xl bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900"
            >
              Zadzwoń
            </a>
          ) : null}
          {profil.email ? (
            <a
              href={`mailto:${profil.email}`}
              className="rounded-xl border border-green-800 px-4 py-2 text-sm font-semibold text-green-900 hover:bg-green-50"
            >
              E-mail
            </a>
          ) : null}
          {wwwHref ? (
            <a
              href={wwwHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
            >
              Strona www
            </a>
          ) : null}
        </div>
      </header>

      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        {profil.details ? (
          <BlokInfoRynku tytul="O firmie / usłudze" ikona="📋">
            <div className="whitespace-pre-wrap">{profil.details}</div>
          </BlokInfoRynku>
        ) : null}
        {profil.service_area ? (
          <BlokInfoRynku tytul="Obszar działania" ikona="📍">
            {profil.service_area}
          </BlokInfoRynku>
        ) : null}
      </div>

      <section className="border-t border-stone-200 px-5 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-serif text-xl text-green-950">Ogłoszenia tego profilu</h2>
          <p className="text-xs text-stone-500">{ogloszenia.length} aktywnych</p>
        </div>
        {ogloszenia.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
            Brak aktywnych ogłoszeń powiązanych z tym profilem.
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {ogloszenia.map((o) => (
              <li key={o.id}>
                <KartaOgloszeniaRynek oferta={o} href={`${sciezkaWsi}/rynek/${o.id}`} uklad="lista" />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-5 text-sm">
          <Link href={`${sciezkaWsi}/rynek`} className="font-medium text-green-800 underline">
            ← Wszystkie ogłoszenia na rynku
          </Link>
        </p>
      </section>
    </article>
  );
}
