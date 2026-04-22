import { createBrowserClient } from "@supabase/ssr";

/** Klient Supabase w przeglądarce (Client Components). Singleton w obrębie zakładki. */
export function utworzKlientaSupabasePrzegladarka() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Brak NEXT_PUBLIC_SUPABASE_URL lub NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return createBrowserClient(url, anonKey);
}
