import Link from "next/link";

type Rola = "soltys" | "mieszkaniec";

type Props = {
  hallId: string;
  rola: Rola;
  /** Gdy true, link do sekcji z zapisanym rzutem parteru (panel mieszkańca). */
  pokazRzutParteruMieszkaniec?: boolean;
};

export function NawigacjaSali({ hallId, rola, pokazRzutParteruMieszkaniec }: Props) {
  const baza = rola === "soltys" ? `/panel/soltys/swietlica/${hallId}` : `/panel/mieszkaniec/swietlica/${hallId}`;
  const linki: { href: string; label: string }[] =
    rola === "soltys"
      ? [
          { href: baza, label: "Przegląd sali" },
          { href: `${baza}#rzut-parteru-sali`, label: "Rzut parteru" },
          { href: `${baza}#plan-sali-edytor`, label: "Plan stołów" },
          { href: `${baza}/dokument`, label: "Dokument wynajmu" },
        ]
      : [
          { href: baza, label: "Sala i rezerwacja" },
          ...(pokazRzutParteruMieszkaniec
            ? [{ href: `${baza}#rzut-parteru-sali-podglad`, label: "Rzut budynku" } as const]
            : []),
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
