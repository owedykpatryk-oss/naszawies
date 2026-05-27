import Link from "next/link";

export type StatusTransportuWsi = {
  villageId: string;
  wiesNazwa: string;
  statusColor: string;
  statusLabel: string;
  delayedCount: number;
  cancelledCount: number;
  fallbackMode: boolean;
  lastRealtime: string | null;
};

function kolorKlasy(color: string): string {
  if (color === "red") return "border-rose-300 bg-rose-50 text-rose-900";
  if (color === "orange") return "border-amber-300 bg-amber-50 text-amber-900";
  return "border-emerald-300 bg-emerald-50 text-emerald-900";
}

export function SoltysTransportPodglad({ wiersze }: { wiersze: StatusTransportuWsi[] }) {
  if (wiersze.length === 0) return null;

  return (
    <section className="mt-6 rounded-xl border border-sky-200/80 bg-sky-50/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-green-950">Transport (PKP)</h3>
          <p className="mt-0.5 text-xs text-stone-600">Status linii z ostatniej synchronizacji.</p>
        </div>
        <Link href="/panel/soltys/transport" className="text-xs font-medium text-green-800 underline">
          Mapowanie stacji →
        </Link>
      </div>
      <ul className="mt-3 space-y-2">
        {wiersze.map((w) => (
          <li
            key={w.villageId}
            className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${kolorKlasy(w.statusColor)}`}
          >
            <span className="font-medium">{w.wiesNazwa}</span>
            <span>
              {w.statusLabel}
              {w.fallbackMode ? " · planowy" : ""}
              {w.delayedCount > 0 ? ` · ${w.delayedCount} opóźn.` : ""}
              {w.cancelledCount > 0 ? ` · ${w.cancelledCount} odwoł.` : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
