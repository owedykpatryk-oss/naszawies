/** Domyślna wartość overlay (0 = pełne zdjęcie, 1 = maks. wybielenie pod tekst). */
export const DOMYSLNY_BACKGROUND_OVERLAY = 0.45;

export function normalizujBackgroundOverlay(wartosc: unknown): number {
  if (typeof wartosc !== "number" || Number.isNaN(wartosc)) return DOMYSLNY_BACKGROUND_OVERLAY;
  return Math.min(1, Math.max(0, wartosc));
}

/** Etykieta suwaka dla użytkownika (odwrotna logika: wyżej = bardziej widoczne zdjęcie). */
export function overlayNaWidocznoscTla(overlay: number): number {
  return Math.round((1 - normalizujBackgroundOverlay(overlay)) * 100);
}

export function widocznoscTlaNaOverlay(widocznoscProcent: number): number {
  const p = Math.min(100, Math.max(0, widocznoscProcent));
  return normalizujBackgroundOverlay(1 - p / 100);
}
