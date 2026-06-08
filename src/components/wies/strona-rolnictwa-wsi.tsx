import Link from "next/link";
import { linkChroniony } from "@/lib/auth/sciezki-chronione";
import { bezpiecznyLinkHttp } from "@/lib/bezpieczenstwo/link-zewnetrzny";
import type { ProfilRolnictwaJson } from "@/lib/rolnictwo/profil-rolnictwa";
import { WiesRolnictwoLazy } from "@/components/wies/wies-rolnictwo-lazy";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import type { WiesPubliczna } from "@/lib/wies/znajdz-wies-po-sciezce";

function SekcjaProfilu({
  tytul,
  ikona,
  children,
  wariant = "neutral",
}: {
  tytul: string;
  ikona?: string;
  children: React.ReactNode;
  wariant?: "neutral" | "ostrzezenie" | "choroba";
}) {
  const klasy =
    wariant === "ostrzezenie"
      ? "border-amber-300/80 bg-gradient-to-br from-amber-50/90 to-white"
      : wariant === "choroba"
        ? "border-red-200 bg-gradient-to-br from-red-50/70 to-white"
        : "border-lime-200/80 bg-white shadow-sm";
  const kolorTytulu =
    wariant === "ostrzezenie" ? "text-amber-950" : wariant === "choroba" ? "text-red-950" : "text-lime-950";

  return (
    <section className={`rounded-2xl border p-5 sm:p-6 ${klasy}`}>
      <h2 className={`flex items-center gap-2 font-serif text-lg ${kolorTytulu}`}>
        {ikona ? <span className="text-xl" aria-hidden>{ikona}</span> : null}
        {tytul}
      </h2>
      <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{children}</div>
    </section>
  );
}

function PrzyciskPill({
  href,
  children,
  wariant = "primary",
}: {
  href: string;
  children: React.ReactNode;
  wariant?: "primary" | "secondary";
}) {
  const klasy =
    wariant === "primary"
      ? "border-lime-700/30 bg-lime-50 text-lime-950 hover:bg-lime-100"
      : "border-stone-300 bg-white text-stone-800 hover:bg-stone-50";
  return (
    <Link href={href} className={`rounded-full border px-4 py-2 text-sm font-medium transition ${klasy}`}>
      {children}
    </Link>
  );
}

function LinkZewnetrzny({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-lime-300 bg-white px-3 py-1.5 text-sm font-medium text-lime-900 shadow-sm hover:bg-lime-50"
    >
      {label}
      <span aria-hidden>↗</span>
    </a>
  );
}

export type KoloRolnikowSkrot = {
  id: string;
  name: string;
  sciezka: string;
};

export function StronaRolnictwaWsi({
  wies,
  profil,
  kolaRolnikow,
  zalogowany = false,
}: {
  wies: WiesPubliczna;
  profil: ProfilRolnictwaJson | null;
  kolaRolnikow: KoloRolnikowSkrot[];
  zalogowany?: boolean;
}) {
  const sciezka = sciezkaProfiluWsi(wies);
  const linkEw = bezpiecznyLinkHttp(profil?.link_ewniosekplus);
  const linkKrap = bezpiecznyLinkHttp(profil?.link_krap);
  const maKontakt =
    profil?.kontakt_arimr || profil?.kontakt_odr || profil?.biuro_obslugi || profil?.kontakt_telefon || profil?.kontakt_email;

  return (
    <main className="mx-auto min-w-0 w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 text-stone-800">
      <nav className="text-sm text-stone-600" aria-label="Okruszki">
        <Link href={sciezka} className="hover:text-lime-900">
          {wies.name}
        </Link>
        <span className="mx-2 text-stone-400">/</span>
        <span className="text-stone-900">Rolnictwo</span>
      </nav>

      <header className="relative mt-6 overflow-hidden rounded-2xl border border-lime-200/80 bg-gradient-to-br from-lime-50 via-white to-amber-50/40 p-6 shadow-sm sm:p-8">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-lime-300/25 blur-2xl"
          aria-hidden
        />
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-lime-800">Rolnictwo · skup · dopłaty</p>
        <h1 className="mt-2 font-serif text-3xl text-lime-950 sm:text-4xl">Rolnictwo — {wies.name}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
          Kontakty ARiMR i ODR, terminy dopłat WPR, skup, ostrzeżenia sezonowe oraz ceny GUS — dla rolników i mieszkańców.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <PrzyciskPill href={`${sciezka}/rynek`}>🏷️ Rynek lokalny</PrzyciskPill>
          <PrzyciskPill href={linkChroniony("/mapa", zalogowany, "?poi=sklep_rolniczy")} wariant="secondary">
            🗺️ Skupy na mapie
          </PrzyciskPill>
          <PrzyciskPill href={sciezka} wariant="secondary">
            ← Profil wsi
          </PrzyciskPill>
        </div>
      </header>

      {profil && maKontakt ? (
        <section className="mt-8 rounded-2xl border border-lime-200 bg-gradient-to-br from-lime-50/90 to-white p-5 shadow-sm sm:p-6">
          <h2 className="font-serif text-lg text-lime-950">Pomoc dla rolnika</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {profil.kontakt_arimr ? (
              <div className="rounded-xl border border-lime-100 bg-white/90 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-lime-800">ARiMR</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-stone-800">{profil.kontakt_arimr}</p>
              </div>
            ) : null}
            {profil.kontakt_odr ? (
              <div className="rounded-xl border border-lime-100 bg-white/90 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-lime-800">ODR / doradztwo</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-stone-800">{profil.kontakt_odr}</p>
              </div>
            ) : null}
            {profil.biuro_obslugi ? (
              <div className="rounded-xl border border-lime-100 bg-white/90 p-4 sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wide text-lime-800">Biuro obsługi</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-stone-800">{profil.biuro_obslugi}</p>
              </div>
            ) : null}
          </div>
          {profil.kontakt_telefon || profil.kontakt_email ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {profil.kontakt_telefon ? (
                <a
                  href={`tel:${profil.kontakt_telefon.replace(/\s/g, "")}`}
                  className="rounded-lg bg-lime-800 px-4 py-2 text-sm font-medium text-white hover:bg-lime-900"
                >
                  📞 {profil.kontakt_telefon}
                </a>
              ) : null}
              {profil.kontakt_email ? (
                <a
                  href={`mailto:${profil.kontakt_email}`}
                  className="rounded-lg border border-lime-300 bg-white px-4 py-2 text-sm font-medium text-lime-900 hover:bg-lime-50"
                >
                  ✉️ {profil.kontakt_email}
                </a>
              ) : null}
            </div>
          ) : null}
          {linkEw || linkKrap ? (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-lime-100 pt-4">
              {linkEw ? <LinkZewnetrzny href={linkEw} label="eWniosekPlus" /> : null}
              {linkKrap ? <LinkZewnetrzny href={linkKrap} label="Rejestr zwierząt" /> : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {profil ? (
        <div className="mt-6 space-y-4">
          {profil.terminy_doplaty ? (
            <SekcjaProfilu tytul="Dopłaty i terminy WPR" ikona="📅">
              {profil.terminy_doplaty}
            </SekcjaProfilu>
          ) : null}
          {profil.skup_zboz ? (
            <SekcjaProfilu tytul="Skup zbóż i płodów" ikona="🌾">
              {profil.skup_zboz}
            </SekcjaProfilu>
          ) : null}
          {profil.skup_mleko ? (
            <SekcjaProfilu tytul="Skup mleka i zwierząt" ikona="🥛">
              {profil.skup_mleko}
            </SekcjaProfilu>
          ) : null}
          {profil.odbior_opakowan ? (
            <SekcjaProfilu tytul="Odbiór opakowań po ŚOR" ikona="♻️">
              {profil.odbior_opakowan}
            </SekcjaProfilu>
          ) : null}
          {profil.ostrzezenie_susza ? (
            <SekcjaProfilu tytul="Susza i nawodnienie" ikona="☀️" wariant="ostrzezenie">
              {profil.ostrzezenie_susza}
            </SekcjaProfilu>
          ) : null}
          {profil.choroby_zwierzat ? (
            <SekcjaProfilu tytul="Choroby zwierząt" ikona="🐷" wariant="choroba">
              {profil.choroby_zwierzat}
            </SekcjaProfilu>
          ) : null}
          {profil.uwagi_sezonowe ? (
            <SekcjaProfilu tytul="Uwagi sezonowe" ikona="📋">
              {profil.uwagi_sezonowe}
            </SekcjaProfilu>
          ) : null}
        </div>
      ) : (
        <p className="mt-8 rounded-xl border border-dashed border-lime-300/80 bg-lime-50/40 p-6 text-sm text-stone-600">
          Sołectwo nie opublikowało jeszcze profilu rolniczego z kontaktami ARiMR i dopłatami. Poniżej znajdziesz ceny GUS i zgłoszenia sąsiedzkie.
        </p>
      )}

      {kolaRolnikow.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-lime-200 bg-lime-50/50 p-5 sm:p-6">
          <h2 className="font-serif text-lg text-lime-950">Koła i grupy rolnicze</h2>
          <ul className="mt-4 space-y-2">
            {kolaRolnikow.map((k) => (
              <li key={k.id}>
                <Link
                  href={k.sciezka}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-lime-200/80 bg-white px-4 py-3 shadow-sm transition hover:border-lime-400 hover:shadow"
                >
                  <span>
                    <span className="block font-medium text-lime-950 group-hover:text-lime-900">{k.name}</span>
                    <span className="text-xs text-stone-500">Profil koła · zebrania i kontakt</span>
                  </span>
                  <span className="text-lime-700 transition group-hover:translate-x-0.5" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-10 border-t border-stone-200 pt-8">
        <WiesRolnictwoLazy villageId={wies.id} zalogowany={zalogowany} naPodstroniePelnej />
      </div>
    </main>
  );
}
