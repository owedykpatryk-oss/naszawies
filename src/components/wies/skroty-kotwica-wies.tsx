"use client";

const IKONY_SKROTOW: Record<string, string> = {
  "#sekcja-linki-przydatne": "L",
  "#sekcja-przewodnik-samorzadowy": "G",
  "#kontakty-urzedowe-wsi": "K",
  "#sekcja-wiadomosci-lokalne": "W",
  "#swietlice-wsi": "Ś",
  "#sekcja-aktualnosci-laczone": "A",
  "#sekcja-transport": "T",
  "#sekcja-rynek-lokalny": "R",
  "#sekcja-blog-historia": "B",
  "#sekcja-organizacje": "O",
  "#sekcja-pomoc-sasiedzka": "P",
};

type Skrot = { href: string; label: string };

/** Kotwice bez globalnego smooth scroll — szybsze na długim profilu wsi. */
export function SkrotyKotwicaWies({ skroty }: { skroty: Skrot[] }) {
  function przejdz(e: React.MouseEvent<HTMLAnchorElement>, hash: string) {
    e.preventDefault();
    const cel = document.querySelector(hash);
    if (cel) {
      cel.scrollIntoView({ behavior: "auto", block: "start" });
      history.replaceState(null, "", hash);
    }
  }

  return (
    <nav className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Skróty na stronie wsi">
      {skroty.map((s) => (
        <a
          key={s.href}
          href={s.href}
          onClick={(e) => przejdz(e, s.href)}
          className="group flex items-center gap-2.5 rounded-xl border border-emerald-900/10 bg-white/95 px-3 py-2.5 text-sm font-medium text-green-950 shadow-sm ring-1 ring-white/80 transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-emerald-600/25 hover:bg-emerald-50/80 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/80 text-xs font-bold text-emerald-900 ring-1 ring-emerald-200/60 transition group-hover:bg-emerald-200/80">
            {IKONY_SKROTOW[s.href] ?? "→"}
          </span>
          <span className="leading-snug">{s.label}</span>
        </a>
      ))}
    </nav>
  );
}
