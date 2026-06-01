import type { ReactNode } from "react";
import type { KluczPanelNawigacji } from "@/lib/uzytkownik/preferencje-ui";

type Props = {
  klucz: KluczPanelNawigacji;
  className?: string;
};

function SvgBase({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
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

/** Ikony SVG nawigacji panelu (spójne z dolnym paskiem). */
export function IkonaPanelNawigacji({ klucz, className = "h-4 w-4 shrink-0 opacity-90" }: Props) {
  switch (klucz) {
    case "start":
      return (
        <SvgBase className={className}>
          <path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19v-8.5Z" />
          <path d="M10 20.5V13h4v7.5" />
        </SvgBase>
      );
    case "mieszkaniec":
      return (
        <SvgBase className={className}>
          <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-4v5H5a1 1 0 0 1-1-1v-7.5Z" />
        </SvgBase>
      );
    case "moje":
      return (
        <SvgBase className={className}>
          <path d="M12 3.5 14.8 9l6.2.9-4.5 4.4 1.1 6.2L12 17.8 6.4 20.5l1.1-6.2L3 9.9 9.2 9 12 3.5Z" />
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
    case "soltys":
      return (
        <SvgBase className={className}>
          <path d="M9 11 12 8l3 3" />
          <path d="M12 3v5M7.5 6.5 12 3l4.5 3.5" />
          <rect x="5" y="11" width="14" height="10" rx="1.5" />
        </SvgBase>
      );
    case "profil":
      return (
        <SvgBase className={className}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </SvgBase>
      );
    case "admin":
      return (
        <SvgBase className={className}>
          <path d="M12 3 4 7v6c0 5 3.5 7.7 8 9 4.5-1.3 8-4 8-9V7l-8-4Z" />
        </SvgBase>
      );
    default:
      return (
        <SvgBase className={className}>
          <circle cx="12" cy="12" r="8" />
        </SvgBase>
      );
  }
}
