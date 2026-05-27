import { etykietaStanuZgloszenia } from "@/lib/zgloszenia/szybkie-etykiety";
import { kategorieZgloszen } from "@/lib/zgloszenia/szybkie-etykiety";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";

export type ZgloszeniePubliczne = {
  id: string;
  title: string;
  category: string;
  resolution_note: string;
  resolved_at: string | null;
};

function etykietKat(c: string) {
  return kategorieZgloszen.find((x) => x.value === c)?.label ?? c;
}

export function WiesZgloszeniaPubliczne({ wiersze }: { wiersze: ZgloszeniePubliczne[] }) {
  if (wiersze.length === 0) return null;

  return (
    <section
      id="sekcja-zgloszenia-rozwiazane"
      className="sekcja-poza-foldem mt-10 scroll-mt-8 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-sm sm:p-6"
    >
      <TytulSekcjiWies
        etykieta="Transparentność"
        tytul="Rozwiązane sprawy"
        opis="Podsumowania zamkniętych zgłoszeń — bez danych osobowych zgłaszających."
      />
      <ul className="mt-4 space-y-3">
        {wiersze.map((z) => (
          <li key={z.id} className="rounded-xl border border-emerald-100 bg-emerald-50/40 px-4 py-3">
            <p className="text-xs text-stone-600">
              {etykietKat(z.category)} · {etykietaStanuZgloszenia("rozwiazane")}
              {z.resolved_at
                ? ` · ${new Date(z.resolved_at).toLocaleDateString("pl-PL")}`
                : null}
            </p>
            <p className="mt-1 font-medium text-stone-900">{z.title}</p>
            <p className="mt-1 text-sm text-stone-800 whitespace-pre-wrap">{z.resolution_note}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
