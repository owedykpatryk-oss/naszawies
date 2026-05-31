import Link from "next/link";

type Priorytet = "neutral" | "uwaga" | "pilne";

const obramowanie: Record<Priorytet, string> = {
  neutral: "border-stone-200/90 hover:border-emerald-300/70",
  uwaga: "border-amber-300/90 hover:border-amber-500/80",
  pilne: "border-red-300/90 hover:border-red-500/80",
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
      className={`kpi-kafel group block p-3 ${obramowanie[p]}`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500 group-hover:text-stone-700">{etykieta}</p>
      <p className="mt-1 font-serif text-2xl font-semibold tabular-nums text-green-950">{liczba}</p>
      <p className="mt-1 text-xs leading-snug text-stone-600">{opis}</p>
    </Link>
  );
}
