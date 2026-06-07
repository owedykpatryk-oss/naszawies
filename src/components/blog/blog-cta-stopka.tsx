import Link from "next/link";

export function BlogCtaStopka() {
  return (
    <section className="mt-12 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-green-50 to-emerald-50/80 p-6 text-center dark:border-emerald-900/50 dark:from-green-950/40 dark:to-stone-900/60 sm:p-8">
      <h2 className="font-serif text-xl text-green-950 dark:text-green-50 sm:text-2xl">
        Dołącz do swojej wsi online
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-stone-700 dark:text-stone-300">
        Załóż bezpłatne konto, znajdź miejscowość w katalogu i korzystaj z narzędzi dla mieszkańców lub sołtysa.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Link
          href="/rejestracja"
          className="min-h-[44px] rounded-xl bg-green-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-900"
        >
          Załóż konto
        </Link>
        <Link
          href="/szukaj"
          className="min-h-[44px] rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        >
          Szukaj wsi
        </Link>
      </div>
    </section>
  );
}
