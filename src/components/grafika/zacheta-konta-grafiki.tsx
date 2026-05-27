import Link from "next/link";

type Props = {
  /** Gdzie wrócić po zalogowaniu */
  nextSciezka?: string;
  liczbaSzablonow: number;
  /** Pełny baner u góry vs kompaktowy przy zapisie */
  wariant?: "baner" | "kompakt" | "zapis";
  /** Ukryj gdy użytkownik ma zapis w chmurze */
  ukryj?: boolean;
};

const KORZYSCI = [
  "Zapis projektów w chmurze — wróć do plakatu za tydzień",
  "Publikacja na profilu wsi i tablica cyfrowa w świetlicy",
  "Ogłoszenie + kalendarz wydarzeń jednym kliknięciem (sołtys)",
  "Rezerwacja sali → gotowe zaproszenie z datą i miejscem",
  "Fotokronika i powiadomienia o imprezach w Twojej wsi",
];

export function ZachetaKontaGrafiki({
  nextSciezka = "/panel/mieszkaniec/grafika",
  liczbaSzablonow,
  wariant = "baner",
  ukryj = false,
}: Props) {
  if (ukryj) return null;

  const next = encodeURIComponent(nextSciezka);
  const linkRejestracja = `/rejestracja?next=${next}`;
  const linkLogowanie = `/logowanie?next=${next}`;

  if (wariant === "kompakt") {
    return (
      <p className="text-xs text-stone-600">
        <Link href={linkRejestracja} className="font-medium text-green-800 underline">
          Załóż darmowe konto
        </Link>
        {" · "}
        <Link href={linkLogowanie} className="text-green-800 underline">
          Zaloguj się
        </Link>
        {" — zapis w chmurze i więcej funkcji."}
      </p>
    );
  }

  if (wariant === "zapis") {
    return (
      <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4">
        <p className="text-sm font-semibold text-amber-950">Chcesz zapisać projekt na stałe?</p>
        <p className="mt-1 text-xs text-stone-600">
          Bez konta szkic zostaje tylko w tej przeglądarce. Po rejestracji — chmura, publikacja i integracje.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={linkRejestracja}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900"
          >
            Załóż konto — za darmo
          </Link>
          <Link
            href={linkLogowanie}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm text-stone-800 hover:bg-stone-50"
          >
            Mam już konto
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="no-print overflow-hidden rounded-2xl border border-green-200/90 bg-gradient-to-br from-green-50 via-white to-sky-50/80 p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-green-800">Wypróbuj teraz · załóż konto później</p>
          <h2 className="mt-1 font-serif text-xl font-semibold text-green-950">
            {liczbaSzablonow}+ szablonów — PDF od razu, więcej po rejestracji
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            Możesz zrobić plakat bez logowania. Konto na naszawies.pl odblokowuje zapis, publikację na stronie wsi i
            powiązania z kalendarzem — <strong>bez opłat</strong>.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link
            href={linkRejestracja}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-green-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-900"
          >
            Załóż konto — 2 minuty
          </Link>
          <Link
            href={linkLogowanie}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-green-800/40 bg-white px-5 py-2.5 text-sm font-medium text-green-900 hover:bg-green-50"
          >
            Zaloguj się
          </Link>
        </div>
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {KORZYSCI.map((k) => (
          <li key={k} className="flex gap-2 text-xs leading-relaxed text-stone-700">
            <span className="text-green-700" aria-hidden>
              ✓
            </span>
            {k}
          </li>
        ))}
      </ul>
    </section>
  );
}
