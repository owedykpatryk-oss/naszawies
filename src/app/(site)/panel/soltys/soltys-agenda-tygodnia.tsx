import Link from "next/link";
import { ETYKIETA_RODZAJU, KOLOR_RODZAJU, type RodzajWpisKalendarza } from "@/lib/kalendarz/typy-kalendarza";

export type WydarzenieAgenda = {
  id: string;
  title: string;
  starts_at: string;
  wies: string;
  href?: string | null;
  rodzaj?: RodzajWpisKalendarza;
  pilne?: boolean;
};

export function SoltysAgendaTygodnia({ wydarzenia }: { wydarzenia: WydarzenieAgenda[] }) {
  if (wydarzenia.length === 0) return null;

  return (
    <section className="mt-6 rounded-xl border border-blue-200/80 bg-blue-50/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-serif text-base text-green-950">Agenda na 7 dni</h3>
          <p className="mt-1 text-xs text-stone-600">
            Wydarzenia, rezerwacje świetlicy, terminy i zadania — ze wspólnego kalendarza.
          </p>
        </div>
        <Link href="/panel/soltys/kalendarz" className="btn-panel-secondary text-xs">
          Pełny kalendarz
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {wydarzenia.map((e) => (
          <li
            key={e.id}
            className={`flex flex-wrap items-baseline justify-between gap-2 rounded-lg border bg-white px-3 py-2 text-sm shadow-sm ${
              e.pilne ? "border-amber-300" : "border-stone-100"
            }`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                {e.rodzaj ? (
                  <span
                    className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${KOLOR_RODZAJU[e.rodzaj]}`}
                  >
                    {ETYKIETA_RODZAJU[e.rodzaj]}
                  </span>
                ) : null}
                <p className="font-medium text-stone-900">{e.title}</p>
              </div>
              <p className="mt-0.5 text-xs text-stone-500">
                {e.wies} ·{" "}
                {new Date(e.starts_at).toLocaleString("pl-PL", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {e.pilne ? " · pilne" : ""}
              </p>
            </div>
            {e.href ? (
              <Link href={e.href} className="shrink-0 text-xs font-medium text-green-800 underline">
                Szczegóły
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
