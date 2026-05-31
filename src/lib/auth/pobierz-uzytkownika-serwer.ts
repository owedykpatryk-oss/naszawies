import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

/** Sesja z ciasteczka — bez dodatkowego API (middleware waliduje chronione trasy). */
export const pobierzSesjeSerwer = cache(async () => {
  try {
    const supabase = utworzKlientaSupabaseSerwer();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch {
    return null;
  }
});

/** Jedno odczytanie użytkownika na żądanie RSC (deduplikacja layout + strony). */
export const pobierzUzytkownikaSerwer = cache(async (): Promise<User | null> => {
  return (await pobierzSesjeSerwer())?.user ?? null;
});
