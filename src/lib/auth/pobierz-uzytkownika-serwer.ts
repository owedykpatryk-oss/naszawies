import { cache } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

/** Jedno wywołanie getUser() na żądanie RSC (deduplikacja layout + strony). */
export const pobierzUzytkownikaSerwer = cache(async (): Promise<User | null> => {
  try {
    const supabase = utworzKlientaSupabaseSerwer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
});

/** Szybsze niż getUser — tylko do nawigacji (nagłówek), nie do ochrony tras. */
export const pobierzSesjeSerwer = cache(async (): Promise<Session | null> => {
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
