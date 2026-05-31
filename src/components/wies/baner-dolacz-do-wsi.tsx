import Link from "next/link";
import { linkLogowaniaDoWsi, linkRejestracjiDoWsi } from "@/lib/rejestracja/link-dolacz-do-wsi";

type Props = {
  nazwaWsi: string;
  villageId: string;
  zalogowany: boolean;
};

export function BanerDolaczDoWsi({ nazwaWsi, villageId, zalogowany }: Props) {
  if (zalogowany) return null;

  const rejestracja = linkRejestracjiDoWsi(villageId);
  const logowanie = linkLogowaniaDoWsi(villageId);

  return (
    <>
      <section
        className="mt-4 rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-white to-amber-50/40 p-4 shadow-sm sm:p-5"
        aria-labelledby="dolacz-do-wsi-tytul"
      >
        <h2 id="dolacz-do-wsi-tytul" className="font-serif text-lg text-green-950 sm:text-xl">
          Mieszkasz w {nazwaWsi}? Dołącz do społeczności
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-stone-600">
          Za darmo: ogłoszenia, mapa wsi, świetlica, pomoc sąsiedzka i powiadomienia od sołtysa. Rejestracja trwa
          minutę — sołtys zatwierdzi Twój wniosek.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={rejestracja}
            className="inline-flex items-center rounded-xl bg-green-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-900"
          >
            Załóż konto — dołącz do wsi
          </Link>
          <Link
            href={logowanie}
            className="inline-flex items-center rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-green-900 hover:bg-stone-50"
          >
            Mam już konto
          </Link>
        </div>
      </section>

      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-emerald-200/90 bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden"
        role="complementary"
        aria-label="Zaproszenie do dołączenia"
      >
        <p className="text-center text-xs font-medium text-green-950">Dołącz do {nazwaWsi}</p>
        <Link
          href={rejestracja}
          className="mt-2 block w-full rounded-xl bg-green-800 py-2.5 text-center text-sm font-semibold text-white"
        >
          Rejestracja — 0 zł
        </Link>
      </div>
      <div className="h-20 md:hidden" aria-hidden />
    </>
  );
}
