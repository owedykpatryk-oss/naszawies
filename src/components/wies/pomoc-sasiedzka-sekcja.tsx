import Link from "next/link";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";

export type OfertaPomocyPubliczna = {
  id: string;
  kind: string;
  category: string;
  title: string;
  body: string;
  contact_hint: string | null;
  published_at: string | null;
  created_at: string;
};

const ETYKIETA_KATEGORII: Record<string, string> = {
  transport: "Transport",
  zakupy: "Zakupy",
  opieka: "Opieka",
  inne: "Inne",
};

export function PomocSasiedzkaSekcja({
  oferty,
  sciezkaPanelu,
  zalogowany,
}: {
  oferty: OfertaPomocyPubliczna[];
  sciezkaPanelu: string;
  zalogowany: boolean;
}) {
  if (oferty.length === 0 && !zalogowany) return null;

  return (
    <section
      id="sekcja-pomoc-sasiedzka"
      className="sekcja-poza-foldem mt-10 scroll-mt-8 rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/80 via-white to-stone-50/50 p-5 shadow-sm sm:p-6"
    >
      <TytulSekcjiWies
        etykieta="Wzajemna pomoc"
        tytul="Pomoc sąsiedzka"
        opis="Oferty i prośby mieszkańców — transport, zakupy, opieka. Po moderacji sołtysa."
      />
      {zalogowany ? (
        <p className="mt-3 text-sm">
          <Link href={sciezkaPanelu} className="font-medium text-violet-900 underline">
            Dodaj ofertę lub prośbę w panelu →
          </Link>
        </p>
      ) : null}
      {oferty.length === 0 ? (
        <p className="mt-4 text-sm text-stone-600">Brak aktywnych ogłoszeń pomocy — sprawdź ponownie później.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {oferty.map((o) => (
            <li key={o.id} className="rounded-xl border border-violet-100 bg-white/95 px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">
                {o.kind === "oferuje" ? "Oferuję" : "Szukam"} · {ETYKIETA_KATEGORII[o.category] ?? o.category}
              </p>
              <p className="mt-1 font-medium text-stone-900">{o.title}</p>
              <p className="mt-1 text-sm text-stone-700 whitespace-pre-wrap">{o.body}</p>
              {o.contact_hint ? (
                <p className="mt-2 text-xs text-stone-600">Kontakt: {o.contact_hint}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
