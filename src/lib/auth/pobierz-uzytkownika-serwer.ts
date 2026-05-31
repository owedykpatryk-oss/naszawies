import type { User } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { cache } from "react";
import { maCiasteczkaSesjiSupabaseSerwer } from "@/lib/auth/ciasteczka-sesji";
import { NAGLOWEK_USER_EMAIL, NAGLOWEK_USER_ID } from "@/lib/auth/naglowki-sesji-middleware";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

/** Nagłówki ustawiane w middleware po odświeżeniu sesji (RSC nie zawsze samo zapisze token). */

function uzytkownikZNaglowkowMiddleware(): User | null {
  if (!maCiasteczkaSesjiSupabaseSerwer()) return null;
  const id = headers().get(NAGLOWEK_USER_ID);
  if (!id) return null;
  const email = headers().get(NAGLOWEK_USER_EMAIL) ?? undefined;
  return {
    id,
    email,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: "",
  } as User;
}

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
  const zSesji = (await pobierzSesjeSerwer())?.user ?? null;
  if (zSesji) return zSesji;
  return uzytkownikZNaglowkowMiddleware();
});

/** Server Actions — getSession może odświeżyć token i zapisać ciasteczka (w RSC zapis bywa zablokowany). */
export async function pobierzUzytkownikaDoAkcji(): Promise<User | null> {
  try {
    const supabase = utworzKlientaSupabaseSerwer();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) return session.user;
  } catch {
    // kontynuuj z nagłówkiem middleware
  }
  return uzytkownikZNaglowkowMiddleware();
}
