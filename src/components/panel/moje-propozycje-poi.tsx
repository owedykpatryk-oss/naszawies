import Link from "next/link";
import { etykietaKategoriiPoi } from "@/lib/mapa/kategorie-poi";
import type { MojaPropozycjaPoi } from "@/lib/mapa/pobierz-moje-propozycje-poi";

function etykietaStatusu(status: MojaPropozycjaPoi["status"]): { tekst: string; klasy: string } {
  if (status === "approved") {
    return { tekst: "Zaakceptowana", klasy: "border-emerald-300 bg-emerald-50 text-emerald-900" };
  }
  if (status === "rejected") {
    return { tekst: "Odrzucona", klasy: "border-rose-300 bg-rose-50 text-rose-900" };
  }
  return { tekst: "Oczekuje na sołtysa", klasy: "border-amber-300 bg-amber-50 text-amber-900" };
}

type Props = {
  propozycje: MojaPropozycjaPoi[];
};

export function MojePropozycjePoi({ propozycje }: Props) {
  if (propozycje.length === 0) return null;

  return (
    <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="font-serif text-xl text-green-950">Moje propozycje na mapie</h2>
      <p className="mt-1 text-sm text-stone-600">
        Punkty, które zaproponowałeś na mapie wsi — status rozpatrzenia przez sołtysa.
      </p>
      <ul className="mt-4 divide-y divide-stone-100">
        {propozycje.map((p) => {
          const st = etykietaStatusu(p.status);
          return (
            <li key={p.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-stone-900">{p.name}</p>
                <p className="text-xs text-stone-500">
                  {p.nazwaWsi} · {etykietaKategoriiPoi(p.category)} ·{" "}
                  {new Date(p.created_at).toLocaleDateString("pl-PL")}
                </p>
                {p.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-stone-600">{p.description}</p>
                ) : null}
                {p.status === "rejected" && p.review_note ? (
                  <p className="mt-1 text-xs text-rose-800">Powód: {p.review_note}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${st.klasy}`}>
                  {st.tekst}
                </span>
                {p.status === "approved" && p.created_poi_id ? (
                  <Link
                    href={`/mapa/miejsce/${p.created_poi_id}`}
                    className="text-xs font-medium text-green-800 underline"
                  >
                    Zobacz na mapie →
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
