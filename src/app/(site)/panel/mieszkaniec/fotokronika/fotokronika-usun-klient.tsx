"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { usunMojeOczekujaceZdjecie } from "../akcje-fotokronika";

export function FotokronikaUsunKlient({ idZdjecia }: { idZdjecia: string }) {
  const router = useRouter();
  const [czek, startT] = useTransition();
  return (
    <button
      type="button"
      disabled={czek}
      onClick={() => {
        if (!window.confirm("Usunąć to zdjęcie? Zniknie też plik w magazynie.")) return;
        startT(async () => {
          const w = await usunMojeOczekujaceZdjecie({ photoId: idZdjecia });
          if ("blad" in w) {
            alert(w.blad);
            return;
          }
          router.refresh();
        });
      }}
      className="text-xs text-red-800 underline hover:text-red-950"
    >
      {czek ? "…" : "Usuń (tylko oczekujące)"}
    </button>
  );
}
