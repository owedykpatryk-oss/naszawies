"use client";

import { usePathname } from "next/navigation";
import { DolnaNawigacjaMobilna } from "./dolna-nawigacja-mobilna";

type Props = {
  zalogowany?: boolean;
};

const UKRYJ_NA = ["/logowanie", "/rejestracja", "/reset-hasla", "/auth/", "/embed/"];

/** Ukrywa dolny pasek na stronach auth. */
export function DolnaNawigacjaWarunkowa({ zalogowany = false }: Props) {
  const pathname = usePathname() ?? "";
  if (UKRYJ_NA.some((p) => pathname.startsWith(p))) return null;
  return <DolnaNawigacjaMobilna zalogowany={zalogowany} />;
}
