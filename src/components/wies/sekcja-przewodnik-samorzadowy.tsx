import { SamorzadTeoriaPubliczna } from "@/components/wies/samorzad-teoria-publiczna";
import type { WiesPubliczna } from "@/lib/wies/znajdz-wies-po-sciezce";

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
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">{tytul}</h3>
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
    <section className="mt-10">
      <h2 className="font-serif text-xl text-green-950">Gmina, powiat, województwo — kto za co</h2>
      <p className="mt-1 text-sm text-stone-600">
        Skrót, gdzie szukać pomocy urzędowej i jak zwykle dzielą się zadania. Konkretne adresy, telefony i linki do BIP —
        uzupełnia sołtys w panelu (sekcja poniżej, jeśli już zapisana).
      </p>

      <div className="mt-5">
        <SamorzadTeoriaPubliczna nazwaGminy={wies.commune} nazwaPowiatu={wies.county} nazwaWojewodztwa={wies.voivodeship} />
      </div>

      {maWpisySołtysa ? (
        <div className="mt-8 space-y-4">
          <h3 className="text-sm font-semibold text-green-950">Na miejscu we wsi (uzupełnione przez sołtysa)</h3>
          <BlokTresci tytul="Gmina — kontakty i sprawy" tresc={przewodnik!.commune_info} />
          <BlokTresci tytul="Powiat — kontakty i sprawy" tresc={przewodnik!.county_info} />
          <BlokTresci tytul="Województwo — kontakty i sprawy" tresc={przewodnik!.voivodeship_info} />
          <BlokTresci tytul="Drogi, dojazdy, zgłoszenia" tresc={przewodnik!.roads_info} />
          <BlokTresci tytul="Śmieci, PSZOK, środowisko" tresc={przewodnik!.waste_info} />
          <BlokTresci tytul="Woda, energia, operatorzy" tresc={przewodnik!.utilities_info} />
          <BlokTresci tytul="Inne (np. straż, OSP, koordynacja)" tresc={przewodnik!.other_info} />
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-stone-300 bg-stone-50/80 px-4 py-3 text-sm text-stone-600">
          Sołtys może dopisać tutaj telefony do urzędu gminy, link do harmonogramu śmieci, numery awaryjne i wskazówki,
          komu w Waszej okolicy zgłasza się np. dziurę na konkretnej drodze — wtedy pojawi się sekcja „Na miejscu we
          wsi”.
        </p>
      )}
    </section>
  );
}
