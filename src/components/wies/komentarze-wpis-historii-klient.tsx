"use client";

import { dodajKomentarzPodWpisHistorii } from "@/lib/historia/akcje-komentarze-historii";
import {
  KomentarzePubliczneKlient,
  type KomentarzPublicznyWiersz,
} from "@/components/wies/komentarze-publiczne-klient";

type Props = {
  entryId: string;
  villageId: string;
  sciezkaPowrotu: string;
  komentarze: KomentarzPublicznyWiersz[];
  zalogowany: boolean;
};

export function KomentarzeWpisHistoriiKlient({
  entryId,
  villageId,
  sciezkaPowrotu,
  komentarze,
  zalogowany,
}: Props) {
  return (
    <KomentarzePubliczneKlient
      tytul="Komentarze pod wpisem"
      komentarze={komentarze}
      zalogowany={zalogowany}
      sciezkaPowrotu={sciezkaPowrotu}
      onDodaj={(body) => dodajKomentarzPodWpisHistorii({ entryId, villageId, body })}
    />
  );
}
