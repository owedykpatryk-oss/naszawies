/** Zwraca tekst bannera rynku, jeśli jest aktywny (nie wygasł). */
export function aktywnyBannerRynku(
  tekst: string | null | undefined,
  doDnia: string | null | undefined,
): string | null {
  const t = tekst?.trim();
  if (!t) return null;
  if (!doDnia) return t;

  const granica = new Date(`${doDnia}T23:59:59`);
  if (Number.isNaN(granica.getTime())) return t;
  if (granica < new Date()) return null;
  return t;
}
