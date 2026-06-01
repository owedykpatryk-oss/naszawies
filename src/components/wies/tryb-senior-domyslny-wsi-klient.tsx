"use client";

import { useEffect } from "react";
import { useTrybSenior } from "@/components/ui/tryb-senior-provider";

const KLUCZ = "naszawies-ui-mode";

/** Ustawia tryb seniora przy pierwszej wizycie, jeśli sołtys włączył domyślnie dla wsi. */
export function TrybSeniorDomyslnyWsiKlient({ wlaczony }: { wlaczony: boolean }) {
  const { ustawTryb } = useTrybSenior();

  useEffect(() => {
    if (!wlaczony) return;
    try {
      if (!localStorage.getItem(KLUCZ)) ustawTryb("senior");
    } catch {
      /* ignore */
    }
  }, [wlaczony, ustawTryb]);

  return null;
}
