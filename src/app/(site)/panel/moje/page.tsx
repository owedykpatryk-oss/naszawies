import { NaglowekModuluPanelu } from "@/components/pomoc/naglowek-modulu-panelu";
import Link from "next/link";
import { MojeFeedCoNowego } from "@/components/panel/moje/moje-feed-co-nowego";
import { MojeKartaWsi } from "@/components/panel/moje/moje-karta-wsi";
import { MojeSkrotPowiadomien } from "@/components/panel/moje/moje-skrot-powiadomien";
import { MojeSkrotTransportu } from "@/components/panel/moje/moje-skrot-transportu";
import { pobierzMojFeedCoNowego } from "@/lib/panel/pobierz-moj-feed-co-nowego";
import { pobierzOstatniePowiadomienia } from "@/lib/panel/pobierz-ostatnie-powiadomienia";
import { pobierzMojePowiazaniaPanelu } from "@/lib/panel/pobierz-moje-powiazania";
import { pobierzSkrotTransportuMoje } from "@/lib/panel/pobierz-skrot-transportu-moje";

export default async function MojePrzegladPage() {
  const dane = await pobierzMojePowiazaniaPanelu();
  const pierwszeWies = dane.wies.slice(0, 4);
  const pierwszaGminaHub = dane.gminy[0]?.sciezkaHub ?? dane.gminyObserwowane[0]?.sciezkaHub ?? "/panel/moje/samorzad";
  const pierwszaGminaNazwa = dane.gminy[0]?.gmina ?? dane.gminyObserwowane[0]?.gmina ?? "Huby i obserwacja gminy";
  const [feed, alertyTransportu, ostatniePowiadomienia] = await Promise.all([
    pobierzMojFeedCoNowego(dane.villageIdsFeed, 20),
    pobierzSkrotTransportuMoje(dane.relacjeTransportowe, dane.wies),
    pobierzOstatniePowiadomienia(dane.userId, 5),
  ]);

  return (
    <main>
      <NaglowekModuluPanelu
        etykieta="Twój skrót"
        tytul="Obserwowane"
        hrefPomocy="/pomoc"
        opis={
          <>
            Warstwa „co mnie interesuje” — wsie, gminy i ulubione. Działania (ogłoszenia, świetlica, zgłoszenia) są w{" "}
            <Link href="/panel/mieszkaniec" className="font-medium text-green-800 underline">
              Moja wieś
            </Link>
            .
          </>
        }
      />

      <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="kpi-kafel">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-stone-500">Twoje wsie</dt>
          <dd className="mt-1 font-serif text-2xl font-semibold text-green-950">{dane.wies.length}</dd>
        </div>
        <div className="kpi-kafel kpi-kafel--emerald">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-emerald-800">Aktywne role</dt>
          <dd className="mt-1 font-serif text-2xl font-semibold text-emerald-950">{dane.aktywneRole}</dd>
        </div>
        <div className="kpi-kafel kpi-kafel--sky">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-sky-900">Obserwowane</dt>
          <dd className="mt-1 font-serif text-2xl font-semibold text-sky-950">{dane.liczbaObserwacji}</dd>
        </div>
        <div className="kpi-kafel">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-stone-500">Powiadomienia</dt>
          <dd className="mt-1 font-serif text-2xl font-semibold text-green-950">
            {dane.liczbaNieprzeczytanychPowiadomien}
            {dane.liczbaNieprzeczytanychPowiadomien > 0 ? (
              <Link href="/panel/powiadomienia" className="ml-2 text-sm font-sans font-medium text-green-800 underline">
                czytaj
              </Link>
            ) : null}
          </dd>
        </div>
        <div className="kpi-kafel kpi-kafel--violet">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-violet-900">Zapisane treści</dt>
          <dd className="mt-1 font-serif text-2xl font-semibold text-violet-950">{dane.liczbaZapisanychTresci}</dd>
        </div>
      </dl>

      <MojeFeedCoNowego wpisy={feed} />

      <MojeSkrotTransportu alerty={alertyTransportu} />
      <MojeSkrotPowiadomien wpisy={ostatniePowiadomienia} />

      <section className="mt-8">
        <h2 className="font-serif text-xl text-green-950">Szybkie skróty</h2>
        <div className="siatka-kafli-responsywna mt-4">
          <Link
            href="/panel/moje/wies"
            className="karta-skrot-modulu"
          >
            <span className="font-semibold text-green-950">Moje wsie</span>
            <span className="mt-1 block text-xs text-stone-600">Gdzie jesteś członkiem lub co obserwujesz.</span>
          </Link>
          <Link
            href={pierwszaGminaHub}
            className="karta-skrot-modulu"
          >
            <span className="font-semibold text-green-950">Moja gmina</span>
            <span className="mt-1 block text-xs text-stone-600">{pierwszaGminaNazwa}</span>
          </Link>
          <Link
            href="/panel/moje/firmy"
            className="karta-skrot-modulu"
          >
            <span className="font-semibold text-green-950">Firmy i sklepy</span>
            <span className="mt-1 block text-xs text-stone-600">Obserwowane profile z rynku — powiadomienia o nowych ofertach.</span>
          </Link>
          <Link
            href="/panel/moje/ulubione"
            className="karta-skrot-modulu"
          >
            <span className="font-semibold text-green-950">Ulubione</span>
            <span className="mt-1 block text-xs text-stone-600">Wsie, transport, zapisane treści, powiadomienia.</span>
          </Link>
          <Link
            href="/panel/mieszkaniec/ogloszenia"
            className="karta-skrot-modulu"
          >
            <span className="font-semibold text-green-950">Ogłoszenia</span>
            <span className="mt-1 block text-xs text-stone-600">Działania i treści z Twojej okolicy.</span>
          </Link>
          <Link
            href="/panel/profil"
            className="karta-skrot-modulu"
          >
            <span className="font-semibold text-green-950">Ustawienia konta</span>
            <span className="mt-1 block text-xs text-stone-600">Profil, hasło i ustawienia RODO.</span>
          </Link>
        </div>
      </section>

      {pierwszeWies.length > 0 ? (
        <section className="mt-10">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-serif text-xl text-green-950">Twoje miejscowości</h2>
            <Link href="/panel/moje/wies" className="text-sm font-medium text-green-800 underline">
              Zobacz wszystkie →
            </Link>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {pierwszeWies.map((w) => (
              <li key={w.villageId}>
                <MojeKartaWsi wies={w} kompakt />
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="mt-10 rounded-2xl border border-dashed border-emerald-300/80 bg-emerald-50/30 px-5 py-8 text-center">
          <p className="font-medium text-green-950">Nie masz jeszcze przypisanych miejscowości</p>
          <p className="mt-1 text-sm text-stone-600">Dodaj pierwszą wieś — obserwuj ją albo złóż wniosek o rolę mieszkańca.</p>
          <Link
            href="/panel/moje/wies"
            className="mt-4 inline-flex rounded-xl bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900"
          >
            Dodaj miejscowość
          </Link>
        </section>
      )}

      {dane.oczekujaceRole > 0 ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Masz <strong>{dane.oczekujaceRole}</strong> oczekujących wniosków o rolę — sołtys musi je zatwierdzić.{" "}
          <Link href="/panel/moje/wies#wnioski-w-toku" className="font-medium underline">
            Zobacz status →
          </Link>
        </p>
      ) : null}
    </main>
  );
}
