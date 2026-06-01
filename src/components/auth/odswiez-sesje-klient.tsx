"use client";

import type { AuthChangeEvent } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";

/**
 * Synchronizuje UI po zmianie sesji Supabase (np. wylogowanie w innej karcie).
 * Nie odświeża przy każdym focusie — to powodowało fałszywe przekierowania na logowanie.
 */
export function OdswiezSesjeKlient() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let aktywny = true;

    const odswiez = () => {
      if (!aktywny) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (aktywny) router.refresh();
      }, 300);
    };

    try {
      const supabase = utworzKlientaSupabasePrzegladarka();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
        if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN" || event === "SIGNED_OUT") {
          odswiez();
        }
      });

      return () => {
        aktywny = false;
        if (timerRef.current) clearTimeout(timerRef.current);
        subscription.unsubscribe();
      };
    } catch {
      return undefined;
    }
  }, [router]);

  return null;
}
