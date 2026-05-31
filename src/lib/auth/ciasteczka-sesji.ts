import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

/** Czy żądanie może niesć sesję Supabase (bez wywołania API). */
export function maCiasteczkaSesjiSupabase(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
}

/** W Server Components — bez pełnej walidacji JWT u auth servera. */
export function maCiasteczkaSesjiSupabaseSerwer(): boolean {
  try {
    return cookies()
      .getAll()
      .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
  } catch {
    return false;
  }
}
