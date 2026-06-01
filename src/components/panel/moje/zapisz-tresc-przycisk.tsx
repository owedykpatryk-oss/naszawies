"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { zapiszTresc, usunZapisanaTresc } from "@/app/(site)/panel/moje/akcje";

type Props = {
  villageId: string;
  contentType: "post" | "event" | "listing" | "history";
  contentId: string;
  title: string;
  href: string;
  /** Jeśli użytkownik już zapisał — ID wiersza w user_saved_content. */
  zapisaneId?: string | null;
};

export function ZapiszTrescPrzycisk({ villageId, contentType, contentId, title, href, zapisaneId = null }: Props) {
  const router = useRouter();
  const [czek, startT] = useTransition();
  const [id, ustawId] = useState<string | null>(zapisaneId);
  const [blad, ustawBlad] = useState("");

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={czek}
        onClick={() => {
          ustawBlad("");
          startT(async () => {
            if (id) {
              const w = await usunZapisanaTresc(id);
              if ("blad" in w) {
                ustawBlad(w.blad);
                return;
              }
              ustawId(null);
            } else {
              const w = await zapiszTresc({ villageId, contentType, contentId, title, href });
              if ("blad" in w) {
                ustawBlad(w.blad);
                return;
              }
              if (w.id) ustawId(w.id);
            }
            router.refresh();
          });
        }}
        className={`text-xs font-medium underline disabled:opacity-50 ${
          id ? "text-amber-800" : "text-stone-500 hover:text-green-800"
        }`}
        title={id ? "Usuń z ulubionych w panelu Moje" : "Zapisz w Ulubione (panel Moje)"}
      >
        {id ? "★ W ulubionych" : "☆ Zapisz w ulubionych"}
      </button>
      {blad ? <span className="text-[10px] text-red-700">{blad}</span> : null}
    </span>
  );
}
