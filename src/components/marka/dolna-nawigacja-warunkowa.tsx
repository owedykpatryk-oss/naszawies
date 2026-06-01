"use client";

import { usePathname } from "next/navigation";
import type { KluczDolnejNawigacji } from "@/lib/uzytkownik/preferencje-ui";
import { DolnaNawigacjaMobilna } from "./dolna-nawigacja-mobilna";

type Props = {
  zalogowany?: boolean;
  kluczeDolnejNawigacji?: KluczDolnejNawigacji[];
};

const UKRYJ_NA = ["/logowanie", "/rejestracja", "/reset-hasla", "/auth/", "/embed/"];

/** Ukrywa dolny pasek na stronach auth. */
export function DolnaNawigacjaWarunkowa({ zalogowany = false, kluczeDolnejNawigacji }: Props) {
  const pathname = usePathname() ?? "";
  if (UKRYJ_NA.some((p) => pathname.startsWith(p))) return null;
  return <DolnaNawigacjaMobilna zalogowany={zalogowany} kluczePoczatkowe={kluczeDolnejNawigacji} />;
}
