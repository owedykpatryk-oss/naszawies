"use client";

import { usePathname } from "next/navigation";
import { NaglowekStrony } from "./naglowek-strony";

type LinkPrawy = { href: string; label: string };

type Props = {
  linkiGlowne?: LinkPrawy[];
  linkiAkcje?: LinkPrawy[];
  logoHref?: string;
  className?: string;
};

/** Ukrywa globalny nagłówek w panelu i na stronach auth (tam jest własne logo). */
export function NaglowekWarunkowy(props: Props) {
  const pathname = usePathname();
  if (
    pathname.startsWith("/panel") ||
    pathname.startsWith("/logowanie") ||
    pathname.startsWith("/rejestracja")
  ) {
    return null;
  }
  return <NaglowekStrony {...props} />;
}
