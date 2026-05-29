import { redirect } from "next/navigation";
import { urlLogowaniaZPowrotem } from "@/lib/auth/sciezki-chronione";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

/** Drugi stopień ochrony stron (middleware jest pierwszy). */
export async function wymagajLogowaniaStrona(sciezka: string, search = ""): Promise<void> {
  try {
    const supabase = utworzKlientaSupabaseSerwer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      redirect(urlLogowaniaZPowrotem(sciezka, search));
    }
  } catch {
    /* brak env — polegamy na middleware */
  }
}
