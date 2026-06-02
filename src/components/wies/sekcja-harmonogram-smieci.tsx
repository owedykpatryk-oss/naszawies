import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";
import { ETYKIETY_ODPADOW, NAZWY_DNI, nastepnyWywoz, type WpisHarmonogramuSmieci } from "@/lib/harmonogram-smieci/typy";

type Props = {
  wpisy: WpisHarmonogramuSmieci[];
  wasteInfo?: string | null;
};

export function SekcjaHarmonogramSmieci({ wpisy, wasteInfo }: Props) {
  if (wpisy.length === 0 && !wasteInfo?.trim()) return null;

  return (
    <OslonaSekcjiWies id="sekcja-harmonogram-smieci">
      <TytulSekcjiWies
        etykieta="Komunalne"
        tytul="Harmonogram odpadów"
        opis="Kiedy wywozić śmieci, gabaryty i odpady selektywne."
      />
      {wasteInfo?.trim() ? (
        <p className="mt-3 whitespace-pre-wrap rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-sm text-stone-700">
          {wasteInfo.trim()}
        </p>
      ) : null}
      {wpisy.length > 0 ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {wpisy.map((w) => {
            const nast = nastepnyWywoz(w);
            return (
              <li key={w.id} className="rounded-xl border border-green-200/60 bg-green-50/30 p-3 text-sm">
                <p className="font-medium text-green-950">{ETYKIETY_ODPADOW[w.kind]}</p>
                <p className="mt-1 text-stone-700">
                  {NAZWY_DNI[w.day_of_week]}
                  {w.time_hint ? ` · ${w.time_hint}` : ""}
                </p>
                {nast ? (
                  <p className="mt-1 text-xs text-stone-500">
                    Następny:{" "}
                    {nast.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                ) : null}
                {w.notes ? <p className="mt-1 text-xs text-stone-600">{w.notes}</p> : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </OslonaSekcjiWies>
  );
}
