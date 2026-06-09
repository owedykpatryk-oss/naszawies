"use client";

import { dodajKomentarzPodOgloszenie } from "@/lib/ogloszenia/akcje-komentarze-ogloszenia";
import {
  KomentarzePubliczneKlient,
  type KomentarzPublicznyWiersz,
} from "@/components/wies/komentarze-publiczne-klient";

type Props = {
  postId: string;
  sciezkaPowrotu: string;
  komentarze: KomentarzPublicznyWiersz[];
  zalogowany: boolean;
};

export function KomentarzeOgloszeniaKlient({ postId, sciezkaPowrotu, komentarze, zalogowany }: Props) {
  return (
    <KomentarzePubliczneKlient
      komentarze={komentarze}
      zalogowany={zalogowany}
      sciezkaPowrotu={sciezkaPowrotu}
      onDodaj={(body) => dodajKomentarzPodOgloszenie({ postId, body })}
    />
  );
}
