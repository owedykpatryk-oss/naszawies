const KLUCZ = "naszawies-dokumenty-ulubione";

export function wczytajUlubionePresety(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KLUCZ);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function przelaczUlubionyPreset(id: string): boolean {
  if (typeof localStorage === "undefined") return false;
  const prev = wczytajUlubionePresety();
  const jest = prev.includes(id);
  const next = jest ? prev.filter((x) => x !== id) : [id, ...prev].slice(0, 24);
  localStorage.setItem(KLUCZ, JSON.stringify(next));
  return !jest;
}
