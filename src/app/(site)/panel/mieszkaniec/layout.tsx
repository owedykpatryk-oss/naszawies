import Link from "next/link";

const podstrony = [
  { href: "/panel/mieszkaniec", label: "Przegląd" },
  { href: "/panel/mieszkaniec/ogloszenia", label: "Ogłoszenia" },
  { href: "/panel/mieszkaniec/swietlica", label: "Świetlica" },
];

export default function MieszkaniecLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <nav
        className="no-print mb-8 flex flex-wrap gap-2 border-b border-stone-200 pb-3 text-sm"
        aria-label="Panel mieszkańca"
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
