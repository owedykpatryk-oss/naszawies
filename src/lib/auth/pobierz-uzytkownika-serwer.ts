import type { User } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { maCiasteczkaSesjiSupabaseSerwer } from "@/lib/auth/ciasteczka-sesji";
import {
  NAGLOWEK_USER_EMAIL,
  NAGLOWEK_USER_ID,
  NAGLOWEK_USER_ONBOARDING_DONE,
  NAGLOWEK_USER_SIGNUP_INTENT,
  NAGLOWEK_USER_SIGNUP_VILLAGE_ID,
} from "@/lib/auth/naglowki-sesji-middleware";
import { sciezkaPowrotuZNaglowkow } from "@/lib/auth/sciezka-powrotu-naglowki";
import { urlLogowaniaZPowrotem } from "@/lib/auth/sciezki-chronione";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

/** Nagłówki ustawiane w middleware po odświeżeniu sesji (RSC nie zawsze samo zapisze token). */

function uzytkownikZNaglowkowMiddleware(): User | null {
  if (!maCiasteczkaSesjiSupabaseSerwer()) return null;
  const id = headers().get(NAGLOWEK_USER_ID);
  if (!id) return null;
  const email = headers().get(NAGLOWEK_USER_EMAIL) ?? undefined;
  const signupVillageId = headers().get(NAGLOWEK_USER_SIGNUP_VILLAGE_ID);
  const signupIntent = headers().get(NAGLOWEK_USER_SIGNUP_INTENT);
  const onboardingDone = headers().get(NAGLOWEK_USER_ONBOARDING_DONE);
  const userMetadata: Record<string, unknown> = {};
  if (signupVillageId) userMetadata.signup_village_id = signupVillageId;
  if (signupIntent) userMetadata.signup_intent = signupIntent;
  if (onboardingDone) userMetadata.onboarding_completed_at = onboardingDone;
  return {
    id,
    email,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: userMetadata,
    created_at: "",
  } as User;
}

async function uzytkownikZGetUser(): Promise<User | null> {
  if (!maCiasteczkaSesjiSupabaseSerwer()) return null;
  try {
    const supabase = utworzKlientaSupabaseSerwer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
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
  /** Middleware już zweryfikował sesję na chronionych trasach — nagłówek zapobiega fałszywemu redirectowi na /logowanie. */
  const zNaglowka = uzytkownikZNaglowkowMiddleware();
  if (zNaglowka) return zNaglowka;
  const zSesji = (await pobierzSesjeSerwer())?.user ?? null;
  if (zSesji) return zSesji;
  return uzytkownikZGetUser();
});

/** Server Actions / Route Handlers — sesja z ciasteczek, potem nagłówki middleware. */
export async function pobierzUzytkownikaDoAkcji(): Promise<User | null> {
  const zNaglowka = uzytkownikZNaglowkowMiddleware();
  if (zNaglowka) return zNaglowka;
  try {
    const supabase = utworzKlientaSupabaseSerwer();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) return session.user;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return user;
  } catch {
    /* ignore */
  }
  return null;
}

/** Strony panelu — layout już chroni, ale helper daje typ User bez duplikacji redirectów. */
export async function pobierzUzytkownikaPanelu(): Promise<User> {
  const user = await pobierzUzytkownikaSerwer();
  if (user) return user;
  redirect(urlLogowaniaZPowrotem(sciezkaPowrotuZNaglowkow("/panel")));
}

/** Wymaga zalogowanego użytkownika w Server Action (komunikat jak dotąd w formularzach). */
export async function wymagajUzytkownikaDoAkcji(
  komunikat = "Zaloguj się ponownie.",
): Promise<User | { blad: string }> {
  const user = await pobierzUzytkownikaDoAkcji();
  if (!user) return { blad: komunikat };
  return user;
}
