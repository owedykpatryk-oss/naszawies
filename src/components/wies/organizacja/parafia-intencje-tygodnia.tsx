import { ETYKIETY_DNI_INTENCJI, type ProfilParafiiJson } from "@/lib/wies/profil-organizacji";

type Intencja = NonNullable<ProfilParafiiJson["intencje_tygodniowe"]>[number];

const KOLEJNOSC_DNI: Intencja["dzien"][] = ["nd", "pon", "wt", "sr", "czw", "pt", "sob"];

function dzisIndex(): number {
  return new Date().getDay();
}

function czyDzis(dzien: Intencja["dzien"]): boolean {
  const map: Record<Intencja["dzien"], number> = {
    nd: 0,
    pon: 1,
    wt: 2,
    sr: 3,
    czw: 4,
    pt: 5,
    sob: 6,
  };
  return map[dzien] === dzisIndex();
}

export function ParafiaIntencjeTygodnia({
  intencje,
  kompakt = false,
}: {
  intencje: NonNullable<ProfilParafiiJson["intencje_tygodniowe"]>;
  kompakt?: boolean;
}) {
  const posortowane = [...intencje].sort(
    (a, b) => KOLEJNOSC_DNI.indexOf(a.dzien) - KOLEJNOSC_DNI.indexOf(b.dzien),
  );

  if (kompakt) {
    const dzisiejsze = posortowane.filter((i) => czyDzis(i.dzien));
    const pokaz = dzisiejsze.length > 0 ? dzisiejsze : posortowane.slice(0, 2);
    return (
      <ul className="space-y-2">
        {pokaz.map((w, i) => (
          <li
            key={`${w.dzien}-${i}`}
            className={`rounded-lg border px-3 py-2 text-sm ${
              czyDzis(w.dzien)
                ? "border-violet-400 bg-violet-50/90 shadow-sm ring-1 ring-violet-200/80"
                : "border-violet-100 bg-white/90"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
              {ETYKIETY_DNI_INTENCJI[w.dzien]}
              {w.godzina ? ` · ${w.godzina}` : ""}
              {czyDzis(w.dzien) ? (
                <span className="ml-1.5 rounded-full bg-violet-700 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  dziś
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-stone-800">{w.intencja}</p>
            {w.celebrans ? <p className="mt-0.5 text-xs text-stone-500">{w.celebrans}</p> : null}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="parafia-intencje">
      <div className="hidden sm:block">
        <div className="overflow-x-auto rounded-xl border border-violet-200/80">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead className="bg-violet-50/80">
              <tr className="text-xs text-violet-900/80">
                <th className="px-3 py-2 font-semibold">Dzień</th>
                <th className="px-3 py-2 font-semibold">Godz.</th>
                <th className="px-3 py-2 font-semibold">Intencja</th>
                <th className="px-3 py-2 font-semibold">Celebrans</th>
              </tr>
            </thead>
            <tbody>
              {posortowane.map((w, i) => (
                <tr
                  key={`${w.dzien}-${i}`}
                  className={`border-t border-violet-100/80 text-stone-700 ${
                    czyDzis(w.dzien) ? "bg-violet-50/70" : "bg-white"
                  }`}
                >
                  <td className="px-3 py-2 whitespace-nowrap font-medium">
                    {ETYKIETY_DNI_INTENCJI[w.dzien]}
                    {czyDzis(w.dzien) ? (
                      <span className="ml-1 text-[10px] font-bold uppercase text-violet-700">· dziś</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">{w.godzina || "—"}</td>
                  <td className="px-3 py-2">{w.intencja}</td>
                  <td className="px-3 py-2 text-stone-500">{w.celebrans ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-2 sm:hidden">
        {posortowane.map((w, i) => (
          <article
            key={`${w.dzien}-${i}`}
            className={`rounded-xl border p-3 ${
              czyDzis(w.dzien) ? "border-violet-400 bg-violet-50/90" : "border-violet-100 bg-white"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-violet-800">
              {ETYKIETY_DNI_INTENCJI[w.dzien]}
              {w.godzina ? ` · ${w.godzina}` : ""}
            </p>
            <p className="mt-1 text-sm text-stone-800">{w.intencja}</p>
            {w.celebrans ? <p className="mt-1 text-xs text-stone-500">{w.celebrans}</p> : null}
          </article>
        ))}
      </div>
    </div>
  );
}
