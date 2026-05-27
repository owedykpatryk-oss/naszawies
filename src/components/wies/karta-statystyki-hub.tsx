type Props = {
  etykieta: string;
  wartosc: string | number;
  wariant?: "neutral" | "akcent" | "zloty";
};

const WARIANTY = {
  neutral: "border-stone-200/90 bg-white",
  akcent: "border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 to-white",
  zloty: "border-amber-200/70 bg-gradient-to-br from-amber-50/50 to-white",
};

export function KartaStatystykiHub({ etykieta, wartosc, wariant = "neutral" }: Props) {
  return (
    <div className={`rounded-2xl border px-4 py-3.5 shadow-sm ring-1 ring-stone-900/[0.03] ${WARIANTY[wariant]}`}>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-stone-500">{etykieta}</dt>
      <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums text-green-950">{wartosc}</dd>
    </div>
  );
}
