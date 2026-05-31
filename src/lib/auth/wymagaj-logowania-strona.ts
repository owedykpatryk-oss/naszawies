import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { urlLogowaniaZPowrotem } from "@/lib/auth/sciezki-chronione";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";

/** Drugi stopień ochrony stron (middleware jest pierwszy). */
export async function wymagajLogowaniaStrona(sciezka: string, search = ""): Promise<User> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    throw new Error("Brak konfiguracji Supabase.");
  }
  const user = await pobierzUzytkownikaSerwer();
  if (!user) {
    redirect(urlLogowaniaZPowrotem(sciezka, search));
  }
  return user;
}
