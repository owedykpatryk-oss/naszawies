/**
 * KIN/PRG adresy filtrują po polu SIMC (7 cyfr).
 * W `villages.teryt_id` bywa pełny identyfikator — wyciągamy końcówkę numeryczną.
 */
export function simcDlaZapytaniaKin(terytId: string | null | undefined): string | null {
  if (!terytId) return null;
  const digits = terytId.replace(/\D/g, "");
  if (digits.length >= 7) return digits.slice(-7);
  if (digits.length >= 5) return digits;
  return null;
}
