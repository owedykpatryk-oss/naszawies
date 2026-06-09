import type { SupabaseClient } from "@supabase/supabase-js";

const ROZMIAR_STRONY = 1000;
const MAX_STRON = 15;

/** Pobiera wiersze z tabeli w partiach (limit PostgREST = 1000). */
export async function pobierzWierszePaginacja<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  budujZapytanie: (
    sb: SupabaseClient,
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<{ wiersze: T[]; blad: string | null }> {
  const wiersze: T[] = [];

  for (let strona = 0; strona < MAX_STRON; strona += 1) {
    const from = strona * ROZMIAR_STRONY;
    const to = from + ROZMIAR_STRONY - 1;
    const { data, error } = await budujZapytanie(supabase, from, to);
    if (error) return { wiersze, blad: error.message };
    const partia = data ?? [];
    if (partia.length === 0) break;
    wiersze.push(...partia);
    if (partia.length < ROZMIAR_STRONY) break;
  }

  return { wiersze, blad: null };
}
