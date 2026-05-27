import { GRUPY_KATEGORII_RYNKU } from "@/lib/marketplace/kategorie-ogloszen";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  wymagane?: boolean;
  pokazPustaOpcje?: boolean;
};

/** Select kategorii rynku z grupami (produkty lokalne, maszyny…). */
export function WyborKategoriiRynku({
  id,
  value,
  onChange,
  className = "w-full",
  wymagane,
  pokazPustaOpcje = true,
}: Props) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      required={wymagane}
    >
      {pokazPustaOpcje ? <option value="">— wybierz kategorię —</option> : null}
      {GRUPY_KATEGORII_RYNKU.map((grupa) => (
        <optgroup key={grupa.id} label={grupa.label}>
          {grupa.items.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
