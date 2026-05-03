import Link from "next/link";

const podstrony = [
  { href: "/panel/mieszkaniec", label: "Przegląd" },
  { href: "/panel/mieszkaniec/ogloszenia", label: "Ogłoszenia" },
  { href: "/panel/mieszkaniec/lista-zakupow", label: "Lista zakupów" },
  { href: "/panel/mieszkaniec/swietlica", label: "Świetlica" },
  { href: "/panel/mieszkaniec/zgloszenia", label: "Zgłoszenia" },
  { href: "/panel/mieszkaniec/fotokronika", label: "Fotokronika" },
  { href: "/panel/mieszkaniec/pomoc", label: "Pomoc krok po kroku" },
];

export default function MieszkaniecLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="no-print mb-4 rounded-xl border border-sky-200/80 bg-sky-50/40 px-3 py-2 text-xs text-stone-700">
        <span className="font-semibold text-sky-900">Podpowiedź:</span>{" "}
        zacznij od <Link href="/panel/mieszkaniec/ogloszenia" className="text-green-800 underline">ogłoszeń</Link>, potem{" "}
        <Link href="/panel/mieszkaniec/swietlica" className="text-green-800 underline">świetlicy</Link> i{" "}
        <Link href="/panel/powiadomienia" className="text-green-800 underline">powiadomień</Link>, żeby nic nie przegapić.
      </div>
      <nav
        className="no-print mb-8 min-w-0 rounded-2xl border border-stone-200/60 bg-stone-100/35 p-1.5 shadow-inner ring-1 ring-stone-900/[0.03] lg:sticky lg:top-[5.9rem] lg:z-20"
        aria-label="Panel mieszkańca"
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
