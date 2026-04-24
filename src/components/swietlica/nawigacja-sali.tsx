import Link from "next/link";

type Rola = "soltys" | "mieszkaniec";

type Props = {
  hallId: string;
  rola: Rola;
};

export function NawigacjaSali({ hallId, rola }: Props) {
  const baza = rola === "soltys" ? `/panel/soltys/swietlica/${hallId}` : `/panel/mieszkaniec/swietlica/${hallId}`;
  const linki: { href: string; label: string }[] =
    rola === "soltys"
      ? [
          { href: baza, label: "Przegląd sali" },
          { href: `${baza}#plan-sali-edytor`, label: "Plan stołów" },
          { href: `${baza}/dokument`, label: "Dokument wynajmu" },
        ]
      : [
          { href: baza, label: "Sala i rezerwacja" },
          { href: `${baza}/dokument`, label: "Dokument informacyjny" },
        ];

  return (
    <nav
      className="mb-6 flex flex-wrap gap-2 border-b border-stone-200 pb-3 text-sm"
      aria-label="Podstrony sali"
    >
      {linki.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className="rounded-lg px-3 py-1.5 text-stone-700 ring-green-800 hover:bg-white hover:text-green-950 focus-visible:outline focus-visible:ring-2"
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
