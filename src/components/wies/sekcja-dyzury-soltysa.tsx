import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";
import { NAZWY_DNI } from "@/lib/harmonogram-smieci/typy";

export type DyżurSoltysa = {
  id: string;
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  notes: string | null;
  phone: string | null;
};

type Props = {
  dyzury: DyżurSoltysa[];
};

function formatujCzas(t: string) {
  return t.slice(0, 5);
}

export function SekcjaDyzurySoltysa({ dyzury }: Props) {
  if (dyzury.length === 0) return null;

  return (
    <OslonaSekcjiWies id="sekcja-dyzury-soltysa">
      <TytulSekcjiWies
        etykieta="Kontakt"
        tytul="Dyżury sołtysa"
        opis="Kiedy można zadzwonić lub przyjść po sprawy urzędowe."
      />
      <ul className="mt-4 space-y-2">
        {dyzury.map((d) => (
          <li key={d.id} className="rounded-xl border border-stone-200 bg-white/90 px-4 py-3 text-sm">
            <p className="font-medium text-green-950">
              {d.specific_date
                ? new Date(d.specific_date).toLocaleDateString("pl-PL")
                : d.day_of_week != null
                  ? `Co ${NAZWY_DNI[d.day_of_week].toLowerCase()}`
                  : "Dyżur"}
              {" · "}
              {formatujCzas(d.start_time)}–{formatujCzas(d.end_time)}
            </p>
            {d.location ? <p className="text-stone-600">{d.location}</p> : null}
            {d.phone ? (
              <p className="mt-1">
                <a href={`tel:${d.phone.replace(/\s/g, "")}`} className="font-medium text-green-800 underline">
                  {d.phone}
                </a>
              </p>
            ) : null}
            {d.notes ? <p className="mt-1 text-xs text-stone-500">{d.notes}</p> : null}
          </li>
        ))}
      </ul>
    </OslonaSekcjiWies>
  );
}
