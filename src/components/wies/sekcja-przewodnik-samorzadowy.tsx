import { SamorzadTeoriaPubliczna } from "@/components/wies/samorzad-teoria-publiczna";
import type { WiesPubliczna } from "@/lib/wies/znajdz-wies-po-sciezce";
import { KARTA_LISTY_WIES, OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";

export type PrzewodnikSamorzadowyZapis = {
  commune_info: string | null;
  county_info: string | null;
  voivodeship_info: string | null;
  roads_info: string | null;
  waste_info: string | null;
  utilities_info: string | null;
  other_info: string | null;
};

function BlokTresci({ tytul, tresc }: { tytul: string; tresc: string | null }) {
  if (!tresc?.trim()) return null;
  return (
    <div className={`${KARTA_LISTY_WIES} bg-white/95`}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-900/80">{tytul}</h3>
      <div className="mt-2 whitespace-pre-wrap text-sm text-stone-800">{tresc.trim()}</div>
    </div>
  );
}

export function SekcjaPrzewodnikSamorzadowy({
  wies,
  przewodnik,
}: {
  wies: WiesPubliczna;
  przewodnik: PrzewodnikSamorzadowyZapis | null;
}) {
  const maWpisySołtysa =
    przewodnik &&
    [
      przewodnik.commune_info,
      przewodnik.county_info,
      przewodnik.voivodeship_info,
      przewodnik.roads_info,
      przewodnik.waste_info,
      przewodnik.utilities_info,
      przewodnik.other_info,
    ].some((x) => x && x.trim().length > 0);

  return (
    <OslonaSekcjiWies id="sekcja-przewodnik-samorzadowy" pusta={!maWpisySołtysa}>
      <TytulSekcjiWies
        etykieta="Samorząd"
        tytul="Gmina, powiat, województwo — kto za co"
        opis="Skrót, gdzie szukać pomocy urzędowej i jak zwykle dzielą się zadania. Konkretne adresy i telefony — w linkach przydatnych oraz w uzupełnieniach sołtysa poniżej."
      />

      <div className="mt-5">
        <SamorzadTeoriaPubliczna nazwaGminy={wies.commune} nazwaPowiatu={wies.county} nazwaWojewodztwa={wies.voivodeship} />
      </div>

      {maWpisySołtysa ? (
        <div className="mt-6 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Na miejscu we wsi (sołtys)</h3>
          <BlokTresci tytul="Gmina — kontakty i sprawy" tresc={przewodnik!.commune_info} />
          <BlokTresci tytul="Powiat — kontakty i sprawy" tresc={przewodnik!.county_info} />
          <BlokTresci tytul="Województwo — kontakty i sprawy" tresc={przewodnik!.voivodeship_info} />
          <BlokTresci tytul="Drogi, dojazdy, zgłoszenia" tresc={przewodnik!.roads_info} />
          <BlokTresci tytul="Śmieci, PSZOK, środowisko" tresc={przewodnik!.waste_info} />
          <BlokTresci tytul="Woda, energia, operatorzy" tresc={przewodnik!.utilities_info} />
          <BlokTresci tytul="Inne (np. straż, OSP, koordynacja)" tresc={przewodnik!.other_info} />
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-stone-300/90 bg-white/60 px-4 py-3 text-sm text-stone-600">
          Sołtys może dopisać telefony do urzędu gminy, link do harmonogramu śmieci i wskazówki, komu zgłaszać sprawy
          lokalne — wtedy pojawi się sekcja „Na miejscu we wsi”.
        </p>
      )}
    </OslonaSekcjiWies>
  );
}
