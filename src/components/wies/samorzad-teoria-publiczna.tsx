/**
 * Skrót informacyjny (nie stanowi porady prawnej). Szczegóły zawsze w aktach urzędowych i BIP.
 */
export function SamorzadTeoriaPubliczna({
  nazwaGminy,
  nazwaPowiatu,
  nazwaWojewodztwa,
}: {
  nazwaGminy: string;
  nazwaPowiatu: string;
  nazwaWojewodztwa: string;
}) {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-stone-700">
      <p className="rounded-lg border border-amber-200/80 bg-amber-50/50 px-3 py-2 text-xs text-amber-950">
        Poniżej typowy podział zadań w Polsce — w konkretnej sprawie sprawdź właściwość merytoryczną na stronie BIP urzędu
        lub zadzwoń pod właściwy numer. Twoja miejscowość leży w gminie <strong>{nazwaGminy}</strong>, powiecie{" "}
        <strong>{nazwaPowiatu}</strong>, województwie <strong>{nazwaWojewodztwa}</strong>.
      </p>

      <details className="group rounded-lg border border-stone-200 bg-white px-3 py-2 open:shadow-sm">
        <summary className="cursor-pointer font-medium text-green-950">Gmina — co najczęściej</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs sm:text-sm">
          <li>
            <strong>Drogi gminne</strong> (w tym często drogi wewnętrzne we wsiach) — zgłoszenia, zimowe utrzymanie,
            progi, oznakowanie w granicach zadań gminy; wyjątki bywają przy drogach powiatowych/wojewódzkich przebiegających
            przez wieś.
          </li>
          <li>
            <strong>Odpady komunalne</strong> — harmonogram, PSZOK, zgłoszenia niedostarczenia pojemnika (zwykle
            organizacja przez gminę lub firmę przez nią wybraną).
          </li>
          <li>
            <strong>Woda i kanalizacja na terenie gminy</strong> — często gmina lub spółka wodna w zależności od
            struktury; meldunki, przyłącza — według regulaminu operatora wskazanego przez gminę.
          </li>
          <li>Oświata (szkoły podstawowe w sieci gminnej), wielu sprawach socjalnych pierwszy kontakt: ośrodek pomocy.</li>
          <li>Plan zagospodarowania, zgłoszenia budowlane w zakresie właściwym organowi gminy.</li>
        </ul>
      </details>

      <details className="group rounded-lg border border-stone-200 bg-white px-3 py-2 open:shadow-sm">
        <summary className="cursor-pointer font-medium text-green-950">Powiat — co najczęściej</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs sm:text-sm">
          <li>
            <strong>Drogi powiatowe</strong> — dziury, zatory, zniszczenia nawierzchni na drogach powiatowych (numery
            DP… — zależnie od oznakowania w terenie).
          </li>
          <li>Starostwo: transport szkolny (linie powiatowe), część spraw zdrowia/rejestracji, geodezja w zakresie powiatu.</li>
          <li>Nadzór lub koordynacja w wielu obszarach wynika z ustaw — przy wątpliwościach strona BIP starostwa.</li>
        </ul>
      </details>

      <details className="group rounded-lg border border-stone-200 bg-white px-3 py-2 open:shadow-sm">
        <summary className="cursor-pointer font-medium text-green-950">Województwo — co najczęściej</summary>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs sm:text-sm">
          <li>
            <strong>Drogi wojewódzkie</strong> — zgłoszenia do zarządu dróg wojewódzkich / marszałka (zależnie od
            organizacji w danym województwie).
          </li>
          <li>Fundusze regionalne, programy rozwoju, niektóre pozwolenia i sprawy ponadgminne.</li>
          <li>Inspekcje wojewódzkie (np. sanepid, ochrona środowiska) w ich właściwościach.</li>
        </ul>
      </details>

      <details className="group rounded-lg border border-stone-200 bg-white px-3 py-2 open:shadow-sm">
        <summary className="cursor-pointer font-medium text-green-950">Kto dba o drogi — jak myśleć</summary>
        <p className="mt-2 text-xs sm:text-sm">
          Zależy od <strong>kategorii drogi</strong> (gminna / powiatowa / wojewódzka / krajowa) i lokalnego podziału
          zadań. Na skrzyżowaniach bywa kilku zarządców — w zgłoszeniu warto podać dokładny opis miejsca (GPS, zdjęcie,
          tabliczka z numerem drogi jeśli jest). Sołtys może w polu obok wpisać: komu w Waszej okolicy najczęściej zgłasza się
          sprawy drogowe i po jakim czasie reagują.
        </p>
      </details>

      <details className="group rounded-lg border border-stone-200 bg-white px-3 py-2 open:shadow-sm">
        <summary className="cursor-pointer font-medium text-green-950">Śmieci, śnieg, zieleń</summary>
        <p className="mt-2 text-xs sm:text-sm">
          Wywóz odpadów i PSZOK — zwykle według regulaminu gminy. Odśnieżanie chodników przy prywatnych posesjach vs
          drogi publiczne — inne reguły; zieleń w pasie drogowym może podlegać zarządcy drogi, a w parku — gminie. W
          wątpliwościach: najpierw BIP gminy lub infolinia urzędu.
        </p>
      </details>
    </div>
  );
}
