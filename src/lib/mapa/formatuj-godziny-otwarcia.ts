/** Czytelny tekst z kolumny `opening_hours` (JSONB) lub stringa. */
export function formatujGodzinyOtwarcia(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const t = raw.trim();
    return t.length > 0 ? t : null;
  }
  if (Array.isArray(raw)) {
    const linie = raw
      .map((item) => {
        if (typeof item === "string") return item.trim();
        if (item && typeof item === "object") {
          const o = item as Record<string, unknown>;
          const dzien = String(o.day ?? o.weekday ?? o.dzien ?? o.dzień ?? "").trim();
          const godz =
            o.hours ??
            o.godziny ??
            (o.open && o.close ? `${o.open}–${o.close}` : null) ??
            (o.otwarcie && o.zamkniecie ? `${o.otwarcie}–${o.zamkniecie}` : null);
          if (dzien && godz) return `${dzien}: ${String(godz)}`;
          if (godz) return String(godz);
        }
        return null;
      })
      .filter((x): x is string => Boolean(x));
    return linie.length > 0 ? linie.join(" · ") : null;
  }
  if (typeof raw === "object") {
    const linie = Object.entries(raw as Record<string, unknown>)
      .map(([klucz, wartosc]) => {
        const v = String(wartosc ?? "").trim();
        return v ? `${klucz}: ${v}` : null;
      })
      .filter((x): x is string => Boolean(x));
    return linie.length > 0 ? linie.join(" · ") : null;
  }
  return null;
}
