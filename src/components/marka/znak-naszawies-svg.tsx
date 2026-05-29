type Props = {
  rozmiar?: number;
  className?: string;
  /** Tytuł dla czytników ekranu (domyślnie ukryty — dekoracyjny znak). */
  ariaLabel?: string | null;
};

/** Wektorowy znak marki — chałupa w zielonym kole (favicon, logo, małe ikony). */
export function ZnakNaszawiesSvg({ rozmiar = 48, className = "", ariaLabel = null }: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={rozmiar}
      height={rozmiar}
      viewBox="0 0 48 48"
      className={className}
      role={ariaLabel ? "img" : "presentation"}
      aria-label={ariaLabel ?? undefined}
      aria-hidden={ariaLabel ? undefined : true}
    >
      <defs>
        <linearGradient id="naszawiesZnakG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5a9c3e" />
          <stop offset="100%" stopColor="#2d5a2d" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#naszawiesZnakG)" />
      <path
        d="M14 32V20L24 12L34 20V32H28V24H20V32H14Z"
        fill="#f5f1e8"
        stroke="#d4a017"
        strokeWidth="1.2"
      />
      <circle cx="24" cy="18" r="1.5" fill="#d4a017" />
    </svg>
  );
}
