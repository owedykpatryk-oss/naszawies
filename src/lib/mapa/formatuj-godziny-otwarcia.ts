/** Czytelny tekst z kolumny `opening_hours` (JSONB) lub stringa. */
export type WierszGodzinOtwarcia = { etykieta: string; wartosc: string };

function mapujWierszGodzin(item: unknown): WierszGodzinOtwarcia | null {
  if (typeof item === "string") {
    const t = item.trim();
    return t ? { etykieta: "Godziny", wartosc: t } : null;
  }
  if (item && typeof item === "object") {
    const o = item as Record<string, unknown>;
    const etykieta = String(o.day ?? o.weekday ?? o.dzien ?? o.dzień ?? "").trim();
    const godz =
      o.hours ??
      o.godziny ??
      (o.open && o.close ? `${o.open}–${o.close}` : null) ??
      (o.otwarcie && o.zamkniecie ? `${o.otwarcie}–${o.zamkniecie}` : null);
    if (etykieta && godz) return { etykieta, wartosc: String(godz) };
    if (godz) return { etykieta: "Godziny", wartosc: String(godz) };
  }
  return null;
}

/** Lista wierszy do czytelnego wyświetlania (np. msze, odpust). */
export function pobierzGodzinyOtwarciaListe(raw: unknown): WierszGodzinOtwarcia[] {
  if (raw == null) return [];
  if (typeof raw === "string") {
    const t = raw.trim();
    return t ? [{ etykieta: "Godziny", wartosc: t }] : [];
  }
  if (Array.isArray(raw)) {
    return raw.map(mapujWierszGodzin).filter((x): x is WierszGodzinOtwarcia => Boolean(x));
  }
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .map(([klucz, wartosc]) => {
        const v = String(wartosc ?? "").trim();
        return v ? { etykieta: klucz, wartosc: v } : null;
      })
      .filter((x): x is WierszGodzinOtwarcia => Boolean(x));
  }
  return [];
}

export function formatujGodzinyOtwarcia(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const t = raw.trim();
    return t.length > 0 ? t : null;
  }
  const linie = pobierzGodzinyOtwarciaListe(raw).map((w) => `${w.etykieta}: ${w.wartosc}`);
  return linie.length > 0 ? linie.join(" · ") : null;
}
