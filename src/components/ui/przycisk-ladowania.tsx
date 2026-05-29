type Props = {
  laduje: boolean;
  tekstLadowania?: string;
  tekst: string;
  type?: "submit" | "button";
  onClick?: () => void;
  disabled?: boolean;
  wariant?: "primary" | "secondary" | "danger";
  className?: string;
};

const KLASY: Record<NonNullable<Props["wariant"]>, string> = {
  primary: "btn-panel-primary",
  secondary: "btn-panel-secondary",
  danger: "btn-panel-danger",
};

/** Przycisk panelu ze spójnym stanem ładowania. */
export function PrzyciskLadowania({
  laduje,
  tekstLadowania,
  tekst,
  type = "button",
  onClick,
  disabled,
  wariant = "primary",
  className = "",
}: Props) {
  const zajety = laduje || disabled;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={zajety}
      aria-busy={laduje}
      className={`${KLASY[wariant]} ${className}`.trim()}
    >
      {laduje ? (
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden
          />
          {tekstLadowania ?? "Zapisywanie…"}
        </span>
      ) : (
        tekst
      )}
    </button>
  );
}
