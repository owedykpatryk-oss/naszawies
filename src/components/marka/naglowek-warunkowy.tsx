"use client";

import { usePathname } from "next/navigation";
import { czyStronaBezNaglowkaWitryny } from "@/lib/auth/sciezki-strony-auth";
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
  const pathname = usePathname() ?? "";
  if (czyStronaBezNaglowkaWitryny(pathname)) {
    return null;
  }
  return <NaglowekStrony {...props} />;
}
