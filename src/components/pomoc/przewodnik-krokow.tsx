import Link from "next/link";
import type { SekcjaPrzewodnika } from "@/lib/pomoc/przewodniki";

export function PrzewodnikKrokow({ sekcje }: { sekcje: SekcjaPrzewodnika[] }) {
  return (
    <div className="space-y-6">
      {sekcje.map((s) => (
        <section key={s.id} className="soltys-sekcja scroll-mt-24" id={s.id}>
          <h2 className="font-serif text-lg text-green-950">{s.tytul}</h2>
          <ol className="mt-4 space-y-4">
            {s.kroki.map((k, i) => (
              <li key={k.tytul} className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-800 text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-medium text-stone-900">{k.tytul}</p>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">{k.opis}</p>
                  {k.link ? (
                    <Link href={k.link.href} className="mt-2 inline-block text-sm font-medium text-green-800 underline">
                      {k.link.label} →
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
          {s.wskazowki && s.wskazowki.length > 0 ? (
            <ul className="mt-4 list-disc space-y-1 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 pl-8 text-sm text-amber-950">
              {s.wskazowki.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
}
