import Link from "next/link";

const podstrony = [
  { href: "/panel/soltys", label: "Przegląd" },
  { href: "/panel/soltys/moja-wies", label: "Profil wsi" },
  { href: "/panel/soltys/samorzad", label: "Przewodnik samorządowy" },
  { href: "/panel/soltys/kanaly-rss", label: "Kanały RSS" },
  { href: "/panel/soltys/wiadomosci-lokalne", label: "Wiadomości lokalne" },
  { href: "/panel/soltys/rezerwacje", label: "Rezerwacje sal" },
  { href: "/panel/soltys/swietlica", label: "Świetlica i wyposażenie" },
  { href: "/panel/soltys/spolecznosc", label: "Społeczność i WOW" },
  { href: "/panel/soltys/dokumenty", label: "Generator dokumentów" },
  { href: "/panel/soltys/zgloszenia", label: "Zgłoszenia" },
  { href: "/panel/soltys/fotokronika", label: "Fotokronika" },
];

export default function SoltysLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <nav
        className="no-print mb-8 min-w-0 rounded-2xl border border-stone-200/60 bg-stone-100/35 p-1.5 shadow-inner ring-1 ring-stone-900/[0.03]"
        aria-label="Panel sołtysa"
      >
        <div className="flex max-w-full flex-nowrap gap-1 overflow-x-auto text-xs [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] sm:flex-wrap sm:gap-1.5 sm:overflow-visible sm:text-sm">
          {podstrony.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="shrink-0 rounded-xl px-2.5 py-2 text-stone-700 transition hover:bg-white/90 hover:text-green-950 hover:shadow-sm sm:px-3"
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </div>
  );
}
