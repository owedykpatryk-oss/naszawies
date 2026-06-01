"use client";

import { useEffect } from "react";
import { ZapiszTrescPrzycisk } from "@/components/panel/moje/zapisz-tresc-przycisk";
import { ZapalSwieczkeHistoriaKlient } from "@/components/wies/zapal-swieczke-historia-klient";
import { zwiekszWyswietlenieHistorii } from "@/lib/historia/akcje-historia-reakcje";

type Props = {
  entryId: string;
  villageId: string;
  title: string;
  href: string;
  viewCount: number;
  candleCount: number;
  zapalonaSwieczka?: boolean;
  zapisaneId?: string | null;
};

export function HistoriaWpisEngagementKlient({
  entryId,
  villageId,
  title,
  href,
  viewCount,
  candleCount,
  zapalonaSwieczka = false,
  zapisaneId = null,
}: Props) {
  useEffect(() => {
    void zwiekszWyswietlenieHistorii(entryId);
  }, [entryId]);

  return (
    <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-amber-100/80 pt-4">
      <ZapalSwieczkeHistoriaKlient
        entryId={entryId}
        poczatkowaLiczba={candleCount}
        poczatkowoZapalona={zapalonaSwieczka}
      />
      <ZapiszTrescPrzycisk
        villageId={villageId}
        contentType="history"
        contentId={entryId}
        title={title}
        href={href}
        zapisaneId={zapisaneId}
      />
      {viewCount > 0 ? (
        <span className="text-xs text-stone-500" title="Liczba odsłon">
          👁 {viewCount} odsłon
        </span>
      ) : null}
    </div>
  );
}
