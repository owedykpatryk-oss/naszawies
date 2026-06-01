import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";
import { KartaSzkolyPubliczna, type DaneSzkolyPubliczne } from "@/components/wies/karta-szkoly-publiczna";
import { SekcjaSzkolaTablicaKlient } from "@/components/wies/sekcja-szkola-tablica-klient";
import { UdostepnijTabliceSzkolyKlient } from "@/components/wies/udostepnij-tablice-szkoly-klient";
import { PrzewinDoSekcjiKlient } from "@/components/wies/przewin-do-sekcji-klient";
import type { OgloszenieSzkolyPubliczne } from "@/lib/szkola/teksty-szkoly";

type Props = {
  szkoly: DaneSzkolyPubliczne[];
  ogloszenia: OgloszenieSzkolyPubliczne[];
  linkSzkolaNaMapie?: string | null;
  villageId: string;
  sciezkaProfilu: string;
  nazwaWsi: string;
  przewinPrzyWejsciu?: boolean;
};

export function SekcjaSzkolaPubliczna({
  szkoly,
  ogloszenia,
  linkSzkolaNaMapie,
  villageId,
  sciezkaProfilu,
  nazwaWsi,
  przewinPrzyWejsciu = false,
}: Props) {
  if (szkoly.length === 0 && ogloszenia.length === 0) return null;

  const glowna = szkoly[0];

  return (
    <OslonaSekcjiWies id="sekcja-szkola" wariant="szkola">
      <PrzewinDoSekcjiKlient id="sekcja-szkola" wlacz={przewinPrzyWejsciu} />
      <TytulSekcjiWies
        wariant="szkola"
        etykieta="Edukacja"
        tytul="Szkoła i tablica ogłoszeń"
        opis="Informacje dla uczniów, rodziców i nauczycieli — ogłoszenia, kontakt i zajęcia."
      />
      {glowna ? <KartaSzkolyPubliczna szkola={glowna} linkNaMapie={linkSzkolaNaMapie} /> : null}
      {szkoly.length > 1 ? (
        <ul className="mt-4 space-y-3">
          {szkoly.slice(1).map((s) => (
            <li key={s.id}>
              <KartaSzkolyPubliczna szkola={s} />
            </li>
          ))}
        </ul>
      ) : null}
      <UdostepnijTabliceSzkolyKlient villageId={villageId} sciezkaProfilu={sciezkaProfilu} nazwaWsi={nazwaWsi} />
      <SekcjaSzkolaTablicaKlient
        ogloszenia={ogloszenia}
        nazwaSzkoly={glowna?.name ?? nazwaWsi}
      />
    </OslonaSekcjiWies>
  );
}
