import { redirect } from "next/navigation";
import { urlLogowaniaZPowrotem } from "@/lib/auth/sciezki-chronione";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";

/** Drugi stopień ochrony stron (middleware jest pierwszy). */
export async function wymagajLogowaniaStrona(sciezka: string, search = ""): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    return;
  }
  const user = await pobierzUzytkownikaSerwer();
  if (!user) {
    redirect(urlLogowaniaZPowrotem(sciezka, search));
  }
}
