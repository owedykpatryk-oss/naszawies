import { EMBLEM_MARKI_SRC } from "./logo-naszawies";

type Props = {
  rozmiar?: number;
  className?: string;
  /** Tytuł dla czytników ekranu (domyślnie ukryty — dekoracyjny znak). */
  ariaLabel?: string | null;
};

/** @deprecated Użyj {@link EMBLEM_MARKI_SRC} / komponentu ZnakNaszawies. */
export function ZnakNaszawiesSvg({ rozmiar = 48, className = "", ariaLabel = null }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={EMBLEM_MARKI_SRC}
      alt={ariaLabel ?? "naszawies.pl"}
      width={rozmiar}
      height={rozmiar}
      className={className}
      aria-hidden={ariaLabel ? undefined : true}
    />
  );
}
