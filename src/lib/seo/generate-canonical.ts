import { pobierzBazeUrlWitryny } from "@/lib/seo/konfiguracja-domeny";

/** Bezpieczny URL kanoniczny — tylko ścieżki względne w obrębie witryny. */
export function generateCanonical(sciezka: string): string {
  const baza = pobierzBazeUrlWitryny();
  const s = sciezka.trim();
  if (!s || s === "/") return `${baza}/`;
  if (!s.startsWith("/") || s.startsWith("//")) return baza;
  return `${baza}${s.split("?")[0]?.split("#")[0]}`;
}
