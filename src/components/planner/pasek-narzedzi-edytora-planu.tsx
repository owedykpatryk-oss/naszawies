import type { ReactNode } from "react";

type Props = {
  cofnijDostepne: boolean;
  ponowDostepne: boolean;
  onCofnij: () => void;
  onPonow: () => void;
  snapWlaczone: boolean;
  onSnapChange: (wlaczone: boolean) => void;
  children?: ReactNode;
};

/** Wspólny pasek: cofnij / ponów / siatka + dodatkowe akcje. */
export function PasekNarzedziEdytoraPlanu({
  cofnijDostepne,
  ponowDostepne,
  onCofnij,
  onPonow,
  snapWlaczone,
  onSnapChange,
  children,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-200 bg-stone-50/90 px-2 py-1.5 text-xs">
      <button
        type="button"
        disabled={!cofnijDostepne}
        onClick={onCofnij}
        className="rounded-md border border-stone-300 bg-white px-2 py-1 font-medium disabled:opacity-40"
        title="Cofnij (Ctrl+Z)"
      >
        ↶ Cofnij
      </button>
      <button
        type="button"
        disabled={!ponowDostepne}
        onClick={onPonow}
        className="rounded-md border border-stone-300 bg-white px-2 py-1 font-medium disabled:opacity-40"
        title="Ponów (Ctrl+Y)"
      >
        ↷ Ponów
      </button>
      <label className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 bg-white px-2 py-1">
        <input
          type="checkbox"
          checked={snapWlaczone}
          onChange={(e) => onSnapChange(e.target.checked)}
        />
        Siatka (snap)
      </label>
      {children}
    </div>
  );
}
