/** Supabase czasem typuje relację 1:N jako tablicę — normalizujemy do jednego obiektu. */
export function pojedynczaWies<T extends object>(v: unknown): T | null {
  if (v == null) {
    return null;
  }
  if (Array.isArray(v)) {
    const pierwszy = v[0];
    if (!pierwszy || typeof pierwszy !== "object") {
      return null;
    }
    return pierwszy as T;
  }
  if (typeof v === "object") {
    return v as T;
  }
  return null;
}
