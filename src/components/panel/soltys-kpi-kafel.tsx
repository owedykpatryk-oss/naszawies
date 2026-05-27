import Link from "next/link";

type Priorytet = "neutral" | "uwaga" | "pilne";

const obramowanie: Record<Priorytet, string> = {
  neutral: "border-stone-200 hover:border-emerald-400/60",
  uwaga: "border-amber-300 hover:border-amber-500",
  pilne: "border-red-300 hover:border-red-500",
};

export function SoltysKpiKafel({
  href,
  etykieta,
  liczba,
  opis,
  priorytet = "neutral",
}: {
  href: string;
  etykieta: string;
  liczba: number;
  opis: string;
  priorytet?: Priorytet;
}) {
  const aktywny = liczba > 0 && priorytet !== "neutral";
  const p = aktywny ? priorytet : "neutral";

  return (
    <Link
      href={href}
      className={`group block rounded-xl border bg-white p-3 shadow-sm transition hover:shadow-md ${obramowanie[p]}`}
    >
      <p className="text-xs font-medium text-stone-500 group-hover:text-stone-700">{etykieta}</p>
      <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-green-950">{liczba}</p>
      <p className="mt-1 text-xs leading-snug text-stone-600">{opis}</p>
    </Link>
  );
}
