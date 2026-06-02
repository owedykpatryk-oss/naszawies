import type { AlertWsi } from "@/lib/alerty/typy-alertow";
import { ETYKIETY_ALERTU, IKONY_ALERTU, formatujDateAlertu } from "@/lib/alerty/typy-alertow";
import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";

type Props = {
  alerty: AlertWsi[];
};

export function SekcjaAlertyWsi({ alerty }: Props) {
  const aktywne = alerty.filter((a) => a.status === "active");
  if (aktywne.length === 0) return null;

  return (
    <OslonaSekcjiWies id="sekcja-alerty-wsi">
      <TytulSekcjiWies
        etykieta="Pilne"
        tytul="Alerty awarii"
        opis="Oficjalne komunikaty sołtysa o sytuacjach wymagających uwagi."
      />
      <ul className="mt-4 space-y-3">
        {aktywne.map((a) => (
          <li
            key={a.id}
            className="rounded-2xl border-2 border-red-300/80 bg-gradient-to-br from-red-50 via-white to-amber-50/30 p-4 shadow-sm"
            role="alert"
          >
            <p className="font-semibold text-red-950">
              {IKONY_ALERTU[a.kind]} {a.title}
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-red-800/80">
              {ETYKIETY_ALERTU[a.kind]}
              {a.expected_end_at ? ` · szac. koniec: ${formatujDateAlertu(a.expected_end_at)}` : null}
            </p>
            {a.body ? <p className="mt-2 text-sm text-stone-800 whitespace-pre-wrap">{a.body}</p> : null}
          </li>
        ))}
      </ul>
    </OslonaSekcjiWies>
  );
}
