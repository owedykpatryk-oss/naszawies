import type { SzablonGrafiki } from "./typy";

const TAGI_WYMAGAJACE_DATY = new Set(["plakat", "festyn", "sezon", "zebranie", "Dzień Dziecka"]);

/** Pola do uzupełnienia przed eksportem / integracją z kalendarzem. */
export function walidujPrzedEksportem(
  szablon: SzablonGrafiki,
  wartosci: Record<string, string>,
): string[] {
  const bledy: string[] = [];
  const tytul = wartosci.tytul?.trim();
  if (!tytul || tytul === "…") bledy.push("Tytuł");

  for (const pole of szablon.pola) {
    if (pole.wymagane && !wartosci[pole.id]?.trim()) {
      bledy.push(pole.etykieta);
    }
  }

  const maPoleDate = szablon.pola.some((p) => p.id === "data");
  const wymagaDaty =
    maPoleDate &&
    (szablon.kategoria === "plakaty" ||
      szablon.kategoria === "zaproszenia" ||
      (szablon.tagi ?? []).some((t) => TAGI_WYMAGAJACE_DATY.has(t)));

  if (wymagaDaty && !wartosci.data?.trim()) {
    bledy.push("Data (potrzebna też do kalendarza wsi)");
  }

  return bledy;
}

export function gotowyDoEksportu(szablon: SzablonGrafiki, wartosci: Record<string, string>): boolean {
  return walidujPrzedEksportem(szablon, wartosci).length === 0;
}
