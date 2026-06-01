"use client";

type Props = {
  nazwaWsi: string;
};

function czescDnia(): string {
  const h = new Date().getHours();
  if (h < 5) return "Dobry wieczór";
  if (h < 12) return "Dzień dobry";
  if (h < 18) return "Dzień dobry";
  return "Dobry wieczór";
}

/** Krótkie powitanie kontekstowe na profilu wsi. */
export function PowitanieProfiluWies({ nazwaWsi }: Props) {
  return (
    <p className="powitanie-profilu-wies mt-3 text-sm text-stone-600">
      <span className="font-medium text-[var(--wies-tekst,#14532d)]">{czescDnia()}</span>
      <span className="text-stone-500"> — witamy na stronie </span>
      <span className="font-semibold text-[var(--wies-akcent,#166534)]">{nazwaWsi}</span>
    </p>
  );
}
