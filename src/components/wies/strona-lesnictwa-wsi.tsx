import Link from "next/link";
import { linkChroniony } from "@/lib/auth/sciezki-chronione";
import { bezpiecznyLinkHttp } from "@/lib/bezpieczenstwo/link-zewnetrzny";
import type { OstrzezenieLesne } from "@/lib/lesnictwo/pobierz-ostrzezenia-publiczne";
import type { ProfilLesnictwaJson } from "@/lib/lesnictwo/profil-lesnictwa";
import { OstrzezeniaLesneWsi } from "@/components/wies/ostrzezenia-lesne-wsi";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import type { WiesPubliczna } from "@/lib/wies/znajdz-wies-po-sciezce";

function SekcjaProfilu({ tytul, children }: { tytul: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-serif text-lg text-emerald-950">{tytul}</h2>
      <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{children}</div>
    </section>
  );
}

export function StronaLesnictwaWsi({
  wies,
  profil,
  ostrzezenia,
  zalogowany = false,
}: {
  wies: WiesPubliczna;
  profil: ProfilLesnictwaJson | null;
  ostrzezenia: OstrzezenieLesne[];
  zalogowany?: boolean;
}) {
  const sciezka = sciezkaProfiluWsi(wies);
  const linkLp = bezpiecznyLinkHttp(profil?.link_nadlesnictwo);
  const linkChoinki = bezpiecznyLinkHttp(profil?.link_choinki);

  return (
    <main className="mx-auto min-w-0 w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 text-stone-800">
      <nav className="text-sm text-stone-600" aria-label="Okruszki">
        <Link href={sciezka} className="hover:text-emerald-900">
          {wies.name}
        </Link>
        <span className="mx-2 text-stone-400">/</span>
        <span className="text-stone-900">Leśnictwo</span>
      </nav>

      <header className="mt-6">
        <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Las · leśnictwo · bezpieczeństwo</p>
        <h1 className="mt-1 font-serif text-3xl text-emerald-950 sm:text-4xl">Leśnictwo — {wies.name}</h1>
        <p className="mt-3 max-w-2xl text-sm text-stone-600">
          Zakazy wstępu, wycinki, sezon choinek, kontakt do nadleśnictwa i bieżące ostrzeżenia dla mieszkańców oraz gości.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={linkChroniony("/mapa", zalogowany, "?lesnictwa=1&obwody_lowieckie=1")}
            className="rounded-full border border-emerald-700/30 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-100"
          >
            🗺️ Mapa z warstwami leśnymi
          </Link>
          <Link href={sciezka} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50">
            ← Profil wsi
          </Link>
        </div>
      </header>

      {ostrzezenia.length > 0 ? (
        <div className="mt-8">
          <OstrzezeniaLesneWsi
            ostrzezenia={ostrzezenia}
            nazwaWsi={wies.name}
            sciezkaWsi={sciezka}
            zalogowany={zalogowany}
          />
        </div>
      ) : null}

      {profil ? (
        <div className="mt-8 space-y-4">
          {(profil.nadlesnictwo || profil.lesnictwo) ? (
            <section className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white p-5 sm:p-6">
              <h2 className="font-serif text-lg text-emerald-950">Jednostka LP</h2>
              <dl className="mt-3 space-y-2 text-sm">
                {profil.nadlesnictwo ? (
                  <div>
                    <dt className="font-medium text-stone-600">Nadleśnictwo</dt>
                    <dd className="text-stone-900">{profil.nadlesnictwo}</dd>
                  </div>
                ) : null}
                {profil.lesnictwo ? (
                  <div>
                    <dt className="font-medium text-stone-600">Leśnictwo</dt>
                    <dd className="text-stone-900">{profil.lesnictwo}</dd>
                  </div>
                ) : null}
                {profil.godziny_lesniczowki ? (
                  <div>
                    <dt className="font-medium text-stone-600">Godziny leśniczówki</dt>
                    <dd className="whitespace-pre-wrap text-stone-900">{profil.godziny_lesniczowki}</dd>
                  </div>
                ) : null}
                {profil.kontakt_telefon || profil.kontakt_email ? (
                  <div>
                    <dt className="font-medium text-stone-600">Kontakt</dt>
                    <dd className="text-stone-900">
                      {profil.kontakt_telefon ? `tel. ${profil.kontakt_telefon}` : ""}
                      {profil.kontakt_telefon && profil.kontakt_email ? " · " : ""}
                      {profil.kontakt_email ? profil.kontakt_email : ""}
                    </dd>
                  </div>
                ) : null}
                {linkLp ? (
                  <div>
                    <dt className="font-medium text-stone-600">Strona nadleśnictwa</dt>
                    <dd>
                      <a
                        href={linkLp}
                        className="font-medium text-emerald-800 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {linkLp.replace(/^https?:\/\//, "")}
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          ) : null}

          {profil.zagrozenie_pozarowe ? (
            <section className="rounded-2xl border border-orange-300/80 bg-gradient-to-br from-orange-50 to-amber-50/60 p-5 sm:p-6">
              <h2 className="font-serif text-lg text-orange-950">🔥 Zagrożenie pożarowe</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-orange-950/90">
                {profil.zagrozenie_pozarowe}
              </p>
              <p className="mt-3 text-xs text-orange-900/80">
                W razie pożaru lasu: 112 lub alarmowy numer nadleśnictwa. Nie wchodź do lasu przy wysokim ryzyku.
              </p>
            </section>
          ) : null}

          {profil.sezon_choinek ? (
            <SekcjaProfilu tytul="🎄 Choinki i pozyskanie drzewek">
              {profil.sezon_choinek}
              {linkChoinki ? (
                <>
                  {"\n\n"}
                  <a href={linkChoinki} className="font-medium text-emerald-800 underline" target="_blank" rel="noopener noreferrer">
                    Więcej informacji (link zewnętrzny)
                  </a>
                </>
              ) : null}
            </SekcjaProfilu>
          ) : null}

          {profil.drewno_opal ? <SekcjaProfilu tytul="🪵 Drewno opałowe">{profil.drewno_opal}</SekcjaProfilu> : null}
          {profil.zasady_pobytu ? (
            <SekcjaProfilu tytul="🌲 Zasady pobytu w lesie">{profil.zasady_pobytu}</SekcjaProfilu>
          ) : null}
          {profil.uwagi_sezonowe ? (
            <SekcjaProfilu tytul="📅 Uwagi sezonowe">{profil.uwagi_sezonowe}</SekcjaProfilu>
          ) : null}
        </div>
      ) : (
        <p className="mt-8 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-600">
          Sołectwo nie uzupełniło jeszcze stałego profilu leśnego. Sprawdź aktywne ostrzeżenia powyżej lub skontaktuj się z sołtysem.
        </p>
      )}

      {ostrzezenia.some((o) => o.maObszarMapy) ? (
        <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 sm:p-6">
          <h2 className="font-serif text-lg text-emerald-950">Ostrzeżenia na mapie</h2>
          <p className="mt-2 text-sm text-stone-700">
            Obszary zakazu wstępu, wycinek i innych prac leśnych widać na mapie publicznej (zielony obrys).
          </p>
          <Link
            href={linkChroniony("/mapa", zalogowany, "?lesnictwa=1&ostrzezenia_lesne=1")}
            className="mt-4 inline-flex rounded-full border border-emerald-700/40 bg-white px-4 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-100"
          >
            Otwórz mapę z ostrzeżeniami →
          </Link>
        </section>
      ) : null}
    </main>
  );
}
