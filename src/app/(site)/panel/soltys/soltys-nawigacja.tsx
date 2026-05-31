import { redirect } from "next/navigation";
import {
  NawigacjaPaneluGrupowana,
  type GrupaNawigacjiPanelu,
} from "@/components/panel/nawigacja-panelu-grupowana";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzLicznikiOczekujacychSoltysa, lacznaLiczbaZadanSoltysa } from "@/lib/panel/liczniki-oczekujacych-soltysa";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

function grupyZLiczbami(
  l: Awaited<ReturnType<typeof pobierzLicznikiOczekujacychSoltysa>>,
): GrupaNawigacjiPanelu[] {
  const przeglad = l ? lacznaLiczbaZadanSoltysa(l) : 0;
  return [
    {
      id: "start",
      tytul: "Start",
      linki: [{ href: "/panel/soltys", label: "Przegląd", badge: przeglad > 0 ? przeglad : undefined }],
    },
    {
      id: "promocja",
      tytul: "Wieś i promocja",
      linki: [
        { href: "/panel/soltys/moja-wies", label: "Profil wsi", badge: (l.poiWeryfikacja + l.propozycjePoi) || undefined },
        { href: "/panel/soltys/grafika", label: "Kreator grafiki", highlight: true },
        { href: "/panel/soltys/konkursy", label: "Konkursy zdjęć" },
        { href: "/panel/soltys/transport", label: "Transport PKP" },
      ],
    },
    {
      id: "spolecznosc",
      tytul: "Społeczność",
      linki: [
        { href: "/panel/soltys/spolecznosc", label: "Społeczność i WOW" },
        { href: "/panel/soltys/kanaly-rss", label: "Kanały RSS" },
        { href: "/panel/rada", label: "Moderacja (rada sołecka)" },
      ],
    },
    {
      id: "organizacja",
      tytul: "Organizacja",
      linki: [
        { href: "/panel/soltys/kalendarz", label: "Kalendarz", highlight: true },
        { href: "/panel/soltys/rezerwacje", label: "Rezerwacje sal", badge: l.rezerwacje || undefined },
        { href: "/panel/soltys/swietlica", label: "Świetlica" },
        { href: "/panel/soltys/cmentarz", label: "Plan cmentarza" },
        { href: "/panel/soltys/dokumenty", label: "Generator dokumentów" },
      ],
    },
    {
      id: "admin",
      tytul: "Administracja",
      linki: [
        { href: "/panel/soltys/zgloszenia", label: "Zgłoszenia", badge: l.zgloszenia || undefined },
        { href: "/panel/soltys/zespol", label: "Zespół / współadmin" },
        { href: "/panel/soltys/samorzad", label: "Przewodnik samorządowy" },
        { href: "/panel/soltys/informacje-lokalne", label: "Informacje dla mieszkańców" },
        { href: "/panel/soltys/pomoc", label: "Pomoc sołtysa" },
        { href: "/pomoc?rola=soltys", label: "Centrum pomocy" },
      ],
    },
  ];
}

export async function SoltysNawigacja() {
  const user = await pobierzUzytkownikaSerwer();
  if (!user) redirect("/logowanie?next=/panel/soltys");

  const supabase = utworzKlientaSupabaseSerwer();
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  const liczniki =
    villageIds.length > 0 ? await pobierzLicznikiOczekujacychSoltysa(supabase, villageIds) : null;

  return (
    <NawigacjaPaneluGrupowana
      grupy={liczniki ? grupyZLiczbami(liczniki) : grupyZLiczbami({
        wnioski: 0,
        rezerwacje: 0,
        posty: 0,
        wiadomosci: 0,
        rynek: 0,
        pomoc: 0,
        zgloszenia: 0,
        zdjecia: 0,
        raportySpolecznosci: 0,
        poiWeryfikacja: 0,
        propozycjePoi: 0,
      })}
      ariaLabel="Panel sołtysa"
    />
  );
}
