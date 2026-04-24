/**
 * Dla wniosku o rolę sołtysa: imię i co najmniej jedno nazwisko (dwa słowa, min. 2 znaki w każdym).
 * Akceptuje np. „Jan Maria Kowalski”, „Anna Kowalska-Nowak”.
 */
export function czyPelneImieINazwisko(s: string): boolean {
  const t = s.trim().replace(/\s+/g, " ");
  if (t.length < 5) return false;
  const segmenty = t
    .split(" ")
    .map((x) => x.replace(/^[\s-]+|[\s-]+$/g, ""))
    .filter((x) => x.length >= 2);
  return segmenty.length >= 2;
}
