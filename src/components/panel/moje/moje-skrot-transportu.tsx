import Link from "next/link";
import type { AlertTransportuMoje } from "@/lib/panel/pobierz-skrot-transportu-moje";

function klasyKoloru(kolor: string): string {
  if (kolor === "red") return "border-rose-300 bg-rose-50 text-rose-950";
  if (kolor === "orange") return "border-amber-300 bg-amber-50 text-amber-950";
  return "border-sky-300 bg-sky-50 text-sky-950";
}

export function MojeSkrotTransportu({ alerty }: { alerty: AlertTransportuMoje[] }) {
  if (alerty.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl border border-sky-200/80 bg-gradient-to-br from-sky-50/60 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-serif text-xl text-green-950">Transport — uwagi na linii</h2>
        <Link href="/panel/moje/ulubione" className="text-sm font-medium text-green-800 underline">
          Wszystkie relacje →
        </Link>
      </div>
      <p className="mt-1 text-sm text-stone-600">Skrót z ulubionych połączeń do miasta powiatowego i wojewódzkiego.</p>
      <ul className="mt-4 space-y-2">
        {alerty.map((a) => (
          <li key={a.relationId}>
            <Link
              href={`${a.sciezkaProfilu}#sekcja-transport`}
              className={`karta-wow block rounded-xl border px-4 py-3 shadow-sm ${klasyKoloru(a.statusColor)}`}
            >
              <p className="font-medium">{a.title}</p>
              <p className="mt-1 text-xs opacity-90">
                {a.nazwaWsi}
                {a.targetLabel ? ` · ${a.targetLabel}` : ""} · {a.statusLabel}
                {a.delayedCount > 0 ? ` · ${a.delayedCount} opóźn.` : ""}
                {a.cancelledCount > 0 ? ` · ${a.cancelledCount} odwoł.` : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
