"use client";

import type { AuthChangeEvent } from "@supabase/supabase-js";
import { useEffect } from "react";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";

/**
 * Po powrocie do karty / okna odświeża sesję Supabase z ciasteczek (refresh token),
 * żeby nawigacja między panel / mapa / rynek nie kończyła się ponownym logowaniem.
 */
export function OdswiezSesjeKlient() {
  useEffect(() => {
    let aktywny = true;

    try {
      const supabase = utworzKlientaSupabasePrzegladarka();

      const odswiezSesje = () => {
        if (!aktywny) return;
        void supabase.auth.getSession();
      };

      const onVisibility = () => {
        if (document.visibilityState === "visible") odswiezSesje();
      };

      window.addEventListener("focus", odswiezSesje);
      document.addEventListener("visibilitychange", onVisibility);

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
        if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
          odswiezSesje();
        }
      });

      return () => {
        aktywny = false;
        window.removeEventListener("focus", odswiezSesje);
        document.removeEventListener("visibilitychange", onVisibility);
        subscription.unsubscribe();
      };
    } catch {
      return undefined;
    }
  }, []);

  return null;
}
