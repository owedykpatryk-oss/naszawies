export type WynikJson<T> =
  | { ok: true; status: number; dane: T }
  | { ok: false; status: number; komunikat: string };

/**
 * Bezpieczny odczyt JSON z odpowiedzi API — nie traktuje HTML ani pustej treści jako „brak sieci”.
 */
export async function odczytajJsonOdpowiedzi<T extends { blad?: string }>(
  res: Response,
): Promise<WynikJson<T>> {
  const typ = (res.headers.get("content-type") ?? "").toLowerCase();
  let surowy = "";
  try {
    surowy = await res.text();
  } catch {
    return {
      ok: false,
      status: res.status || 0,
      komunikat:
        res.status === 429
          ? "Zbyt wiele zapytań. Odczekaj chwilę i spróbuj ponownie."
          : "Nie udało się odczytać odpowiedzi serwera. Sprawdź połączenie i spróbuj za chwilę.",
    };
  }

  if (!surowy.trim()) {
    if (res.status === 503) {
      return { ok: false, status: 503, komunikat: "Usługa jest chwilowo niedostępna. Spróbuj za chwilę." };
    }
    if (res.status >= 500) {
      return { ok: false, status: res.status, komunikat: "Błąd serwera. Spróbuj ponownie za chwilę." };
    }
    return { ok: false, status: res.status, komunikat: "Pusta odpowiedź serwera." };
  }

  if (!typ.includes("json") && surowy.trimStart().startsWith("<")) {
    return {
      ok: false,
      status: res.status,
      komunikat: "Serwer zwrócił nieoczekiwaną odpowiedź. Odśwież stronę lub spróbuj później.",
    };
  }

  try {
    const dane = JSON.parse(surowy) as T;
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        komunikat: dane.blad ?? (res.status === 429 ? "Zbyt wiele zapytań." : "Błąd zapytania."),
      };
    }
    return { ok: true, status: res.status, dane };
  } catch {
    return {
      ok: false,
      status: res.status,
      komunikat: "Nie udało się odczytać odpowiedzi (błędny format). Spróbuj ponownie.",
    };
  }
}
