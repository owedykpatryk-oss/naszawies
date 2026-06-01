import type { ReactNode } from "react";
import type { KluczDolnejNawigacji } from "@/lib/uzytkownik/preferencje-ui";

type Props = {
  klucz: KluczDolnejNawigacji;
  className?: string;
};

function SvgBase({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/** Spójne ikony SVG dolnego paska (zamiast emoji). */
export function IkonaDolnejNawigacji({ klucz, className = "dolna-naw-ikona" }: Props) {
  switch (klucz) {
    case "mapa":
      return (
        <SvgBase className={className}>
          <path d="M9 3 3 6v13l6-3 6 3 6-3V6l-6 3-6-3Z" />
          <path d="M9 3v13M15 6v13" />
        </SvgBase>
      );
    case "rynek":
      return (
        <SvgBase className={className}>
          <path d="M6 7h12l-1 12H7L6 7Z" />
          <path d="M9 7V5a3 3 0 0 1 6 0v2" />
        </SvgBase>
      );
    case "szukaj":
      return (
        <SvgBase className={className}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16.5 16.5 4 4" />
        </SvgBase>
      );
    case "moje":
      return (
        <SvgBase className={className}>
          <path d="M12 3.5 14.8 9l6.2.9-4.5 4.4 1.1 6.2L12 17.8 6.4 20.5l1.1-6.2L3 9.9 9.2 9 12 3.5Z" />
        </SvgBase>
      );
    case "panel":
      return (
        <SvgBase className={className}>
          <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19v-8.5Z" />
          <path d="M10 20.5V13h4v7.5" />
        </SvgBase>
      );
    case "czat":
      return (
        <SvgBase className={className}>
          <path d="M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H9l-4 3v-3H5a1.5 1.5 0 0 1-1.5-1.5V7a1.5 1.5 0 0 1 1.5-1.5Z" />
        </SvgBase>
      );
    case "powiadomienia":
      return (
        <SvgBase className={className}>
          <path d="M12 4.5a4.5 4.5 0 0 0-4.5 4.5v3.5L5 15.5h14l-2.5-3V9a4.5 4.5 0 0 0-4.5-4.5Z" />
          <path d="M10 18.5a2 2 0 0 0 4 0" />
        </SvgBase>
      );
    case "pomoc":
      return (
        <SvgBase className={className}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9.5 9.25a2.75 2.75 0 1 1 4.3 2.25c-.85.65-1.3 1.15-1.3 2" />
          <circle cx="12" cy="17" r="0.75" fill="currentColor" stroke="none" />
        </SvgBase>
      );
    case "logowanie":
      return (
        <SvgBase className={className}>
          <circle cx="12" cy="8" r="3.25" />
          <path d="M6 19.5c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
        </SvgBase>
      );
    default:
      return (
        <SvgBase className={className}>
          <circle cx="12" cy="12" r="8.5" />
        </SvgBase>
      );
  }
}
