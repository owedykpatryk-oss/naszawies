import Link from "next/link";

const podstrony = [
  { href: "/panel/soltys", label: "Przegląd" },
  { href: "/panel/soltys/rezerwacje", label: "Rezerwacje sal" },
  { href: "/panel/soltys/swietlica", label: "Świetlica i wyposażenie" },
  { href: "/panel/soltys/dokumenty", label: "Generator dokumentów" },
];

export default function SoltysLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav
        className="no-print mb-8 flex flex-wrap gap-2 border-b border-stone-200 pb-3 text-sm"
        aria-label="Panel sołtysa"
      >
        {podstrony.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-md px-3 py-1.5 text-stone-700 hover:bg-stone-100 hover:text-green-900"
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
