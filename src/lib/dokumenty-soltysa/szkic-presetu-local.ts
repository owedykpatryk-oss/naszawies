/**
 * Lokalny szkic pól formularza generatora (localStorage), per preset.
 * Nie zawiera danych wrażliwych — tylko teksty z szablonu.
 */

const PREFIX = "naszawies-soltys-szkic:v1:";

export function wczytajSzkicPresetu(presetId: string): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFIX + presetId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function zapiszSzkicPresetu(presetId: string, dane: Record<string, string>): void {
  try {
    localStorage.setItem(PREFIX + presetId, JSON.stringify(dane));
  } catch {
    /* quota / private mode */
  }
}

export function usunSzkicPresetu(presetId: string): void {
  try {
    localStorage.removeItem(PREFIX + presetId);
  } catch {
    /* ignore */
  }
}
