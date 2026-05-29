/** Tekst godzin → wartość JSONB do kolumny opening_hours. */
export function tekstDoGodzinOtwarciaJson(tekst: string | null | undefined): string | null {
  const t = tekst?.trim();
  if (!t) return null;
  return t;
}

/** Odczyt godzin z JSONB do pola formularza. */
export function godzinyOtwarciaDoTekstu(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw)) {
    return raw.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join("\n");
  }
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
  }
  return String(raw);
}
