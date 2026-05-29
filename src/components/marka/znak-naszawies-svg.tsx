type Props = {
  rozmiar?: number;
  className?: string;
  /** Tytuł dla czytników ekranu (domyślnie ukryty — dekoracyjny znak). */
  ariaLabel?: string | null;
};

/** @deprecated Użyj {@link LOGO_MARKI_SRC} / komponentu ZnakNaszawies. */
export function ZnakNaszawiesSvg({ rozmiar = 48, className = "", ariaLabel = null }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/marka/logo-naszawies.png"
      alt={ariaLabel ?? "naszawies.pl"}
      width={rozmiar}
      height={rozmiar}
      className={className}
      aria-hidden={ariaLabel ? undefined : true}
    />
  );
}
