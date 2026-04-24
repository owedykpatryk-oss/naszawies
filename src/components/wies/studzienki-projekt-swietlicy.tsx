import Image from "next/image";
import Link from "next/link";
import { StudzienkiProjektNarzedziaKlient } from "./studzienki-projekt-narzedzia-klient";
import { StudzienkiRzutInteraktywny } from "./studzienki-rzut-interaktywny-klient";

const POMIESZCZENIA = [
  { lp: "1.1", nazwa: "Wiatrołap", powierzchnia: "5,76 m²", akcent: "border-l-amber-400" },
  { lp: "1.2", nazwa: "WC damski + dla osób z niepełnosprawnością", powierzchnia: "5,15 m²", akcent: "border-l-sky-400" },
  { lp: "1.3", nazwa: "WC męski", powierzchnia: "4,18 m²", akcent: "border-l-sky-400" },
  { lp: "1.4", nazwa: "Zaplecze kuchni", powierzchnia: "17,20 m²", akcent: "border-l-orange-400" },
  { lp: "1.4b", nazwa: "Spiżarnia / zaplecze (wg rysunku przy kuchni)", powierzchnia: "3,00 m²", akcent: "border-l-orange-300" },
  { lp: "1.5", nazwa: "Pomieszczenie gospodarcze", powierzchnia: "6,30 m²", akcent: "border-l-stone-400" },
  { lp: "1.6", nazwa: "Sala (główna)", powierzchnia: "72,58 m²", akcent: "border-l-green-600" },
] as const;

const PALETA = [
  {
    nazwa: "Tynk mineralny („baranek”, 2 mm)",
    kolor: "Kremowa biel RAL 9003",
    karta: "border-stone-200 bg-stone-50",
    probka: "bg-[#f5f2ea] ring-2 ring-stone-300/80",
  },
  {
    nazwa: "Okładzina imitująca drewno",
    kolor: "Dąb jasny",
    karta: "border-amber-200/80 bg-amber-50/90",
    probka: "bg-gradient-to-br from-amber-200 via-amber-100 to-amber-50 ring-2 ring-amber-300/70",
  },
  {
    nazwa: "Tynk akcentowy + cokół mozaikowy",
    kolor: "Antracyt RAL 7016",
    karta: "border-slate-600 bg-slate-800 text-white",
    probka: "bg-[#383e42] ring-2 ring-slate-500/80",
  },
  {
    nazwa: "Dachówka, okna, obróbki",
    kolor: "Antracyt RAL 7016",
    karta: "border-slate-700 bg-slate-900 text-stone-100",
    probka: "bg-[#2b3033] ring-2 ring-slate-600/80",
  },
  {
    nazwa: "Tarasy / nawierzchniowe",
    kolor: "Płyty betonowe (popielate)",
    karta: "border-stone-300 bg-stone-200/90",
    probka: "bg-gradient-to-br from-stone-400 to-stone-300 ring-2 ring-stone-400/70",
  },
  {
    nazwa: "Balustrady, obróbki blacharskie",
    kolor: "Stal szlachetna / antracyt",
    karta: "border-zinc-400 bg-zinc-100",
    probka: "bg-gradient-to-br from-zinc-300 to-zinc-200 ring-2 ring-zinc-400/70",
  },
] as const;

const SPIS = [
  { id: "#rzut-parteru", label: "Rzut" },
  { id: "#zestawienie", label: "Pomieszczenia" },
  { id: "#elewacje", label: "Elewacje" },
  { id: "#materialy", label: "Materiały" },
  { id: "#wynajem", label: "Wynajem" },
  { id: "#etapy", label: "Etapy" },
  { id: "#faq", label: "FAQ" },
  { id: "#prawne", label: "Uwagi" },
] as const;

function RysunekRamka({
  src,
  alt,
  priority,
  aspectClass,
  sizes,
  plikPng,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  aspectClass: string;
  sizes: string;
  plikPng: string;
}) {
  return (
    <div className="group relative">
      <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-br from-emerald-400/25 via-transparent to-teal-600/15 opacity-0 blur-sm transition duration-500 group-hover:opacity-100" />
      <div className="pointer-events-none absolute inset-0 rounded-xl border-2 border-dashed border-stone-300/50 transition group-hover:border-emerald-300/40" />
      <div className="relative overflow-hidden rounded-xl border border-stone-200/90 bg-gradient-to-b from-white to-stone-50 shadow-[0_1px_0_rgba(0,0,0,0.04),0_12px_40px_-12px_rgba(21,50,30,0.18)] ring-1 ring-black/[0.03] transition duration-500 group-hover:-translate-y-0.5 group-hover:shadow-[0_20px_50px_-18px_rgba(21,83,48,0.28)] group-hover:ring-emerald-900/10">
        <div className={`relative w-full bg-[repeating-linear-gradient(0deg,transparent,transparent_11px,rgba(120,113,108,0.06)_12px)] ${aspectClass}`}>
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain p-3 transition duration-500 ease-out group-hover:scale-[1.02]"
            sizes={sizes}
            priority={priority}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200/80 bg-stone-50/90 px-3 py-2.5 text-xs text-stone-600">
          <span className="font-mono text-[10px] uppercase tracking-wider text-stone-500">Skala 1:100 · PNG</span>
          <a
            href={plikPng}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-green-800 underline decoration-green-800/40 underline-offset-2 hover:text-green-950"
          >
            Otwórz w pełnym rozmiarze →
          </a>
        </div>
      </div>
    </div>
  );
}

export function StudzienkiProjektSwietlicy({
  sciezkaWsi,
  nazwaWsi,
}: {
  sciezkaWsi: string;
  nazwaWsi: string;
}) {
  return (
    <div className="relative text-stone-800">
      {/* Tło „bloku technicznego” */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.45]"
        aria-hidden
        style={{
          backgroundImage: `
            linear-gradient(rgba(21, 83, 48, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(21, 83, 48, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
        }}
      />

      <style dangerouslySetInnerHTML={{
        __html: `
          @media (prefers-reduced-motion: no-preference) {
            @keyframes studz-hero-breathe {
              0%, 100% { opacity: 0.55; transform: scale(1); }
              50% { opacity: 0.88; transform: scale(1.05); }
            }
            .studz-hero-orb { animation: studz-hero-breathe 14s ease-in-out infinite; }
            .studz-hero-orb-delay { animation: studz-hero-breathe 17s ease-in-out infinite 2.5s; }
          }
        `,
      }} />

      <article className="relative">
        <nav className="mb-8 flex flex-wrap items-center gap-2 rounded-xl border border-stone-200/80 bg-white/80 px-4 py-3 text-sm text-stone-600 shadow-sm backdrop-blur-sm">
          <Link href="/" className="rounded-md px-1.5 text-green-800 underline-offset-2 hover:underline">
            Strona główna
          </Link>
          <span className="text-stone-300" aria-hidden>
            /
          </span>
          <Link href={sciezkaWsi} className="rounded-md px-1.5 text-green-800 underline-offset-2 hover:underline">
            {nazwaWsi}
          </Link>
          <span className="text-stone-300" aria-hidden>
            /
          </span>
          <span className="font-medium text-stone-800">Projekt świetlicy</span>
        </nav>

        <div className="rounded-[1.35rem] bg-gradient-to-br from-emerald-300/50 via-teal-200/20 to-green-950/30 p-[1px] shadow-[0_28px_90px_-24px_rgba(6,55,35,0.55)]">
          <header className="relative overflow-hidden rounded-[1.3rem] border border-white/10 bg-gradient-to-br from-green-950 via-green-900 to-emerald-950 px-6 py-10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:px-10">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              aria-hidden
              style={{
                backgroundImage:
                  "repeating-linear-gradient(135deg, white 0, white 1px, transparent 1px, transparent 10px)",
              }}
            />
            <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" aria-hidden />
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/25 blur-3xl studz-hero-orb" />
            <div className="pointer-events-none absolute -bottom-20 left-1/3 h-52 w-52 rounded-full bg-teal-300/15 blur-3xl studz-hero-orb-delay" />
            <div className="pointer-events-none absolute right-1/4 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/5 blur-2xl" aria-hidden />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-100 shadow-sm shadow-emerald-950/20">
                    Dokumentacja 04/2024
                  </span>
                  <span className="rounded-full border border-white/15 bg-black/15 px-3 py-1 text-[10px] font-medium text-emerald-50/95 backdrop-blur-sm">
                    Studzienki · gmina Kcynia
                  </span>
                </div>
                <h1 className="mt-4 font-serif text-3xl leading-[1.1] sm:text-4xl lg:text-[2.45rem]">
                  <span className="block text-emerald-50/90">Rozbudowa, nadbudowa i przebudowa</span>
                  <span className="mt-1 block bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent drop-shadow-sm">
                    świetlicy wiejskiej
                  </span>
                </h1>
                <p className="mt-3 text-xs font-medium uppercase tracking-wide text-emerald-200/90 sm:text-[13px]">
                  Sołectwo {nazwaWsi} · sołtys: Tadeusz Owedyk
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-emerald-50/95 sm:text-base">
                  Przegląd rysunków: układ parteru z metrażami, elewacje z materiałami oraz skrót legendy kolorystycznej
                  — przygotowane tak, żeby mieszkańcom było łatwiej „wejść” w inwestycję zanim powstanie budynek.
                </p>
              </div>
              <div className="w-full shrink-0 lg:w-auto">
                <StudzienkiProjektNarzedziaKlient />
              </div>
            </div>

            <dl className="relative mt-10 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/20 bg-white/[0.08] px-4 py-4 shadow-inner shadow-black/20 backdrop-blur-md transition hover:border-white/30 hover:bg-white/[0.11]">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-emerald-200/90">Powierzchnia użytkowa</dt>
                <dd className="mt-1 font-serif text-3xl tabular-nums tracking-tight">114,17 m²</dd>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/[0.08] px-4 py-4 shadow-inner shadow-black/20 backdrop-blur-md transition hover:border-white/30 hover:bg-white/[0.11]">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-emerald-200/90">Sala główna</dt>
                <dd className="mt-1 font-serif text-3xl tabular-nums tracking-tight">72,58 m²</dd>
              </div>
              <div className="rounded-xl border border-white/20 bg-white/[0.08] px-4 py-4 shadow-inner shadow-black/20 backdrop-blur-md transition hover:border-white/30 hover:bg-white/[0.11]">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-emerald-200/90">Zarys w rzucie</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums leading-snug">ok. 13,3 × 10,3 m</dd>
              </div>
            </dl>
          </header>
        </div>

        {/* Spis treści — mobile */}
        <div className="mt-8 lg:hidden">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-500">Na stronie</p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
            {SPIS.map((s) => (
              <a
                key={s.id}
                href={s.id}
                className="shrink-0 rounded-full border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-medium text-green-900 shadow-sm ring-1 ring-stone-900/5 hover:border-green-300 hover:bg-green-50/80"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div className="mt-10 lg:grid lg:grid-cols-[minmax(0,1fr),200px] lg:gap-12 xl:grid-cols-[minmax(0,1fr),220px]">
          <div className="min-w-0 space-y-20 lg:space-y-24">
            <section id="rzut-parteru" className="scroll-mt-28">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-4">
                <div>
                  <h2 className="font-serif text-2xl text-green-950 sm:text-3xl">Rzut parteru</h2>
                  <p className="mt-2 max-w-prose text-sm leading-relaxed text-stone-600">
                    Poniżej: to samo zdjęcie rzutu z półprzezroczystymi strefami pomieszczeń. Włącz
                    <strong> planowanie stołów w sali głównej</strong> (przeciąganie) — orientacyjnie, względem
                    rysunku, nie w skali 1:1. Strefy możesz dopasować do rysunku, edytując tablicę
                    w pliku <code className="rounded bg-stone-100 px-1 text-[11px]">studzienki-rzut-dane.ts</code>.
                  </p>
                </div>
                <span className="hidden rounded-md border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-[10px] text-stone-500 sm:inline-block">
                  RZUT PARTERU
                </span>
              </div>
              <figure className="mt-8">
                <StudzienkiRzutInteraktywny />
                <figcaption className="mt-3 text-center text-xs text-stone-500">
                  Źródło: materiały projektowe przekazane do serwisu (rzut parteru) — interakcja to warstwa
                  poglądowa, nie odbija dokładnie linii rysunku (dopasuj współrzędne stref, jeśli trzeba).
                </figcaption>
              </figure>
            </section>

            <section id="zestawienie" className="scroll-mt-28">
              <div className="border-b border-stone-200 pb-4">
                <h2 className="font-serif text-2xl text-green-950 sm:text-3xl">Zestawienie pomieszczeń</h2>
                <p className="mt-2 max-w-prose text-sm leading-relaxed text-stone-600">
                  Metraże jak w tabeli na rysunku — podkreślono salę jako główną przestrzeń spotkań.
                </p>
              </div>
              <div className="mt-8 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-stone-200 bg-gradient-to-r from-stone-100 to-stone-50 text-xs uppercase tracking-wide text-stone-600">
                    <tr>
                      <th className="px-4 py-3.5 font-semibold">Lp.</th>
                      <th className="px-4 py-3.5 font-semibold">Pomieszczenie</th>
                      <th className="px-4 py-3.5 text-right font-semibold">Powierzchnia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {POMIESZCZENIA.map((r) => (
                      <tr
                        key={r.lp}
                        className={`border-l-4 ${r.akcent} ${r.lp === "1.6" ? "bg-green-50/70 hover:bg-green-50" : r.lp === "1.4b" ? "bg-orange-50/40 hover:bg-stone-50/80" : "hover:bg-stone-50/80"}`}
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-stone-500">{r.lp}</td>
                        <td
                          className={`px-4 py-3 ${r.lp === "1.6" ? "font-semibold text-green-950" : "text-stone-800"}`}
                        >
                          {r.nazwa}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-stone-900">
                          {r.powierzchnia}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-green-800/20 bg-gradient-to-r from-green-100/90 to-emerald-50/80 font-bold text-green-950">
                      <td className="px-4 py-4" colSpan={2}>
                        Razem
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums">114,17 m²</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Inwestor</p>
                  <p className="mt-2 text-lg font-semibold text-green-950">Gmina Kcynia</p>
                  <p className="mt-1 text-sm text-stone-600">
                    ul. Rynek 23
                    <br />
                    89-240 Kcynia
                  </p>
                  <a
                    href="https://kcynia.pl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm font-medium text-green-800 underline"
                  >
                    kcynia.pl →
                  </a>
                </div>
                <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/80 p-5">
                  <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Lokalizacja</p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-700">
                    Studzienki — obręb ewidencyjny; numer działki według operatu w dokumentacji (np.{" "}
                    <span className="font-mono">590/7</span>).
                  </p>
                  <p className="mt-3 text-xs text-stone-500">
                    Adres świetlicy w prowadzeniu rezerwacji: ul. Leśna 17 — korespondencja sołectwa: ul. Leśna 2.
                  </p>
                </div>
              </div>
            </section>

            <section id="elewacje" className="scroll-mt-28">
              <div className="border-b border-stone-200 pb-4">
                <h2 className="font-serif text-2xl text-green-950 sm:text-3xl">Elewacje — projektowane</h2>
                <p className="mt-2 max-w-prose text-sm leading-relaxed text-stone-600">
                  Cztery ściany budynku: przeszklenia sali, zadaszenie od południa, wejście główne i detale tarasów.
                </p>
              </div>
              <figure className="mt-8">
                <RysunekRamka
                  src="/wies/studzienki/elewacje.png"
                  alt="Cztery elewacje projektowanej świetlicy w Studzienkach z legendą materiałów i kolorów"
                  aspectClass="aspect-[16/10] min-h-[240px] sm:min-h-[360px]"
                  sizes="(max-width: 1024px) 100vw, min(960px, 85vw)"
                  plikPng="/wies/studzienki/elewacje.png"
                />
                <figcaption className="mt-3 text-center text-xs text-stone-500">
                  Rysunek z 10.04.2024 — szczegóły warstw ścian i kolorystyki na oryginalnej legendzie.
                </figcaption>
              </figure>
            </section>

            <section id="materialy" className="scroll-mt-28">
              <div className="border-b border-stone-200 pb-4">
                <h2 className="font-serif text-2xl text-green-950 sm:text-3xl">Materiały i kolorystyka</h2>
                <p className="mt-2 max-w-prose text-sm leading-relaxed text-stone-600">
                  Skrót legendy z rysunku elewacji — obok każdego opisu wizualna „próbka” odcienia.
                </p>
              </div>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {PALETA.map((p, i) => (
                  <li
                    key={i}
                    className={`flex gap-4 rounded-xl border p-4 shadow-sm ${p.karta}`}
                  >
                    <div className={`h-14 w-14 shrink-0 rounded-full shadow-inner ${p.probka}`} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">Warstwa / wykończenie</p>
                      <p className="mt-1 text-sm font-semibold leading-snug">{p.nazwa}</p>
                      <p className="mt-1.5 text-xs opacity-90">{p.kolor}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                <li className="flex gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm">
                  <span className="text-lg" aria-hidden>
                    ◆
                  </span>
                  Tarasy i schody zewnętrzne — płytki mrozoodporne, antypoślizgowe.
                </li>
                <li className="flex gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm">
                  <span className="text-lg" aria-hidden>
                    ◆
                  </span>
                  Drewno — ochrona przed ogniem i grzybem (wymagania WT).
                </li>
                <li className="flex gap-3 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm sm:col-span-2">
                  <span className="text-lg" aria-hidden>
                    ◆
                  </span>
                  Rynny, obróbki, wsporniki — stal szlachetna w tonacji antracytowej, spójna ze stolarką.
                </li>
              </ul>
            </section>

            <section id="wynajem" className="scroll-mt-28">
              <div className="relative overflow-hidden rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/95 via-white to-teal-50/50 p-6 shadow-[0_24px_60px_-28px_rgba(15,80,55,0.22)] sm:p-8">
                <div
                  className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-400/25 blur-3xl"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute -bottom-24 left-0 h-48 w-48 rounded-full bg-teal-300/20 blur-3xl"
                  aria-hidden
                />
                <div className="relative">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800/75">Nasza Wieś · rezerwacje</p>
                  <h2 className="mt-2 font-serif text-2xl text-green-950 sm:text-3xl">Wynajem sali i opcjonalny asortyment</h2>
                  <p className="mt-3 max-w-prose text-sm leading-relaxed text-stone-700">
                    W serwisie rezerwacja świetlicy jest osobnym krokiem od samego projektu budowlanego — ale już dziś
                    warto wiedzieć: <strong>wyposażenie sali</strong> (stoły, krzesła, sprzęt, zabawki itd.) prowadzi
                    sołtys jako lista w panelu. Przy składaniu wniosku mieszkaniec może dopasować sprzęt w
                    formularzu — pole wyposażenia i uwagi — tak, żeby wynajem obejmował tylko to, co naprawdę jest
                    potrzebne.
                  </p>
                  <ul className="mt-6 grid gap-3 sm:grid-cols-3">
                    <li className="rounded-xl border border-emerald-100/90 bg-white/80 px-4 py-3 text-sm text-stone-700 shadow-sm backdrop-blur-sm">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800/70">Katalog</span>
                      <span className="mt-1 block leading-snug">Sołtys uzupełnia pozycje, stany i zdjęcia w panelu świetlicy.</span>
                    </li>
                    <li className="rounded-xl border border-emerald-100/90 bg-white/80 px-4 py-3 text-sm text-stone-700 shadow-sm backdrop-blur-sm">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800/70">Opcjonalnie</span>
                      <span className="mt-1 block leading-snug">Rezerwujący dobiera z listy i dopisuje brakujące uwagi.</span>
                    </li>
                    <li className="rounded-xl border border-emerald-100/90 bg-white/80 px-4 py-3 text-sm text-stone-700 shadow-sm backdrop-blur-sm">
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800/70">Dokument</span>
                      <span className="mt-1 block leading-snug">Zestawienie może trafić do dokumentu wynajmu po akceptacji.</span>
                    </li>
                  </ul>
                  <p className="mt-6 text-xs leading-relaxed text-stone-600">
                    Obowiązują regulamin i cennik ustalone przy danej świetlicy — po uruchomieniu obiektu w serwisie.
                  </p>
                </div>
              </div>
            </section>

            <section id="etapy" className="scroll-mt-28">
              <div className="border-b border-stone-200 pb-4">
                <h2 className="font-serif text-2xl text-green-950 sm:text-3xl">Etapy inwestycji (schemat)</h2>
                <p className="mt-2 max-w-prose text-sm text-stone-600">
                  Uproszczony tor od dokumentacji do użytkowania — konkretne daty i postępy publikują inwestor i
                  wykonawca (BIP, tablice informacyjne).
                </p>
              </div>
              <ol className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-stretch">
                {[
                  { krok: "1", tytul: "Projekt", opis: "Dokumentacja, uzgodnienia, materiały przetargowe" },
                  { krok: "2", tytul: "Zamówienie", opis: "Postępowanie / wybór wykonawcy" },
                  { krok: "3", tytul: "Budowa", opis: "Roboty, odbiory częściowe" },
                  { krok: "4", tytul: "Odbiór", opis: "Przekazanie do użytkowania sołectwu" },
                ].map((e) => (
                  <li
                    key={e.krok}
                    className="group relative flex flex-1 min-w-[140px] flex-col overflow-hidden rounded-xl border border-stone-200/90 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-emerald-200/80 hover:shadow-[0_16px_40px_-20px_rgba(21,83,48,0.2)] sm:max-w-[200px]"
                  >
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-green-700 opacity-80"
                      aria-hidden
                    />
                    <span className="relative mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-green-800 to-emerald-900 text-sm font-bold text-white shadow-md ring-2 ring-white/90">
                      {e.krok}
                    </span>
                    <p className="mt-3 font-semibold text-green-950">{e.tytul}</p>
                    <p className="mt-1 text-xs leading-relaxed text-stone-600">{e.opis}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section id="faq" className="scroll-mt-28 space-y-3">
              <div className="border-b border-stone-200 pb-4">
                <h2 className="font-serif text-2xl text-green-950 sm:text-3xl">Pytania o konto i sołtysa</h2>
                <p className="mt-2 max-w-prose text-sm text-stone-600">
                  Krótko, jak to się ma do serwisu — bez obietnic zamiast regulaminu gminy.
                </p>
              </div>
              <details className="group rounded-xl border border-stone-200 bg-white shadow-sm open:border-emerald-200/80 open:shadow-md">
                <summary className="cursor-pointer list-none px-5 py-4 font-medium text-green-950 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-2">
                    Czy sołtys może się zarejestrować i ustawić hasło?
                    <span className="text-stone-400 transition group-open:rotate-180">▼</span>
                  </span>
                </summary>
                <div className="border-t border-stone-100 px-5 pb-4 pt-2 text-sm leading-relaxed text-stone-700">
                  <p>
                    Tak — ta sama rejestracja co dla mieszkańców: adres e-mail, hasło (co najmniej{" "}
                    <span className="font-mono text-xs">8</span> znaków), powtórzenie hasła, wyświetlana nazwa, potwierdzenie
                    konta linkiem z wiadomości. Formularz znajduje się pod{" "}
                    <Link href="/rejestracja" className="font-medium text-green-800 underline decoration-green-800/35 underline-offset-2">
                      /rejestracja
                    </Link>
                    .
                  </p>
                  <p className="mt-3">
                    Samo założenie konta <strong>nie nadaje automatycznie</strong> roli sołtysa dla wsi — tę rolę
                    nadaje się po weryfikacji (np. zapis na listę oczekujących, kontakt z zespołem serwisu). Dopiero
                    aktywna rola sołtysa otwiera pełny panel zarządzania świetlicą i rezerwacjami.
                  </p>
                </div>
              </details>
              <details className="group rounded-xl border border-stone-200 bg-white shadow-sm open:border-emerald-200/80 open:shadow-md">
                <summary className="cursor-pointer list-none px-5 py-4 font-medium text-green-950 [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-2">
                    Czy mieszkaniec musi mieć konto, żeby zarezerwować salę?
                    <span className="text-stone-400 transition group-open:rotate-180">▼</span>
                  </span>
                </summary>
                <div className="border-t border-stone-100 px-5 pb-4 pt-2 text-sm leading-relaxed text-stone-700">
                  <p>
                    Rezerwacja i podgląd wyposażenia odbywają się po zalogowaniu — użyj{" "}
                    <Link href="/rejestracja" className="font-medium text-green-800 underline decoration-green-800/35 underline-offset-2">
                      rejestracji
                    </Link>{" "}
                    lub{" "}
                    <Link href="/logowanie" className="font-medium text-green-800 underline decoration-green-800/35 underline-offset-2">
                      logowania
                    </Link>
                    . Szczegóły zatwierdzania mieszkańców przez sołtysa zależą od ustawień danej wsi.
                  </p>
                </div>
              </details>
            </section>

            <section id="prawne" className="scroll-mt-28 rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-orange-50/40 px-5 py-5 text-sm text-amber-950 shadow-sm">
              <p className="font-semibold text-amber-900">Informacja prawna</p>
              <p className="mt-2 leading-relaxed">
                Treść ma charakter <strong>poglądowy</strong> i opiera się na przekazanych rysunkach. W sprawach
                wiążących obowiązują dokumenty <strong>Gminy Kcynia</strong> oraz wykonawcy.
              </p>
            </section>

            <details className="group rounded-xl border border-stone-200 bg-white px-5 py-4 shadow-sm">
              <summary className="cursor-pointer list-none font-medium text-green-950 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-2">
                  Co jeszcze można dodać na tej stronie?
                  <span className="text-stone-400 transition group-open:rotate-180">▼</span>
                </span>
              </summary>
              <ul className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-sm text-stone-700">
                <li>
                  <strong>Galeria z placu budowy</strong> — zdjęcia z progresu (po uzyskaniu zgód / RODO przy twarzach).
                </li>
                <li>
                  <strong>PDF do pobrania</strong> — skrócony „informator mieszkańca” z BIP-u gminy.
                </li>
                <li>
                  <strong>Linki do EZamówienia / postępowania</strong> — gdy mają być publiczne.
                </li>
                <li>
                  <strong>FAQ rezerwacji</strong> — rozbudowa sekcji FAQ o kaucję, sprzątanie, alkohol — zsynchronizowane
                  z regulaminem w panelu (nad tym można pracować równolegle z obecnym FAQ konta).
                </li>
                <li>
                  <strong>Oś czasu z datami</strong> — automatycznie z newsów gminy lub ręcznie przez sołtysa (moduł CMS).
                </li>
                <li>
                  <strong>Widok 360° lub model 3D</strong> — jeśli pojawi się materiał promocyjny inwestycji.
                </li>
              </ul>
            </details>
          </div>

          {/* Spis treści — desktop (sticky) */}
          <aside className="mt-10 hidden lg:mt-0 lg:block">
            <nav
              className="sticky top-24 space-y-2 rounded-xl border border-stone-200 bg-white/90 p-4 text-sm shadow-sm backdrop-blur-sm"
              aria-label="Spis treści strony projektu"
            >
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-500">Spis treści</p>
              <ul className="space-y-1">
                {SPIS.map((s) => (
                  <li key={s.id}>
                    <a
                      href={s.id}
                      className="block rounded-lg px-2 py-1.5 text-stone-700 transition hover:bg-green-50 hover:text-green-900"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-stone-100 pt-4 text-[11px] leading-relaxed text-stone-500">
                Wskazówka: użyj <kbd className="rounded border border-stone-300 bg-stone-100 px-1 font-mono text-[10px]">#</kbd>{" "}
                w pasku adresu po wejściu na stronę, by szybko skakać między kotwicami w niektórych przeglądarkach.
              </p>
            </nav>
          </aside>
        </div>
      </article>
    </div>
  );
}
