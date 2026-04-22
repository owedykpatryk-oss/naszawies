import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Klient z anon key — tylko operacje dozwolone przez RLS (np. INSERT na waitlist). */
export function createPublicSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}
