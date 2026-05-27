import { redirect } from "next/navigation";
import {
  NawigacjaPaneluGrupowana,
  type GrupaNawigacjiPanelu,
} from "@/components/panel/nawigacja-panelu-grupowana";
import { pobierzLicznikiOczekujacychSoltysa } from "@/lib/panel/liczniki-oczekujacych-soltysa";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

function grupyZLiczbami(
  l: Awaited<ReturnType<typeof pobierzLicznikiOczekujacychSoltysa>>,
): GrupaNawigacjiPanelu[] {
  const moderacjaSpolecznosci = l.raportySpolecznosci;
  const przeglad =
    l.wnioski + l.posty + l.wiadomosci + l.rynek + l.pomoc;
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
        { href: "/panel/soltys/moja-wies", label: "Profil wsi" },
        { href: "/panel/soltys/grafika", label: "Kreator grafiki", highlight: true },
        { href: "/panel/soltys/fotokronika", label: "Fotokronika", badge: l.zdjecia || undefined },
        { href: "/panel/soltys/konkursy", label: "Konkursy zdjęć" },
        { href: "/panel/soltys/lowiectwo", label: "Polowania" },
        { href: "/panel/soltys/transport", label: "Transport PKP" },
      ],
    },
    {
      id: "spolecznosc",
      tytul: "Społeczność",
      linki: [
        {
          href: "/panel/soltys/spolecznosc",
          label: "Społeczność i WOW",
          badge: moderacjaSpolecznosci || undefined,
        },
        {
          href: "/panel/soltys/spolecznosc/moderacja",
          label: "Raporty treści",
          badge: moderacjaSpolecznosci || undefined,
        },
        {
          href: "/panel/soltys/wiadomosci-lokalne",
          label: "Wiadomości lokalne",
          badge: l.wiadomosci || undefined,
        },
        { href: "/panel/soltys/kanaly-rss", label: "Kanały RSS" },
      ],
    },
    {
      id: "organizacja",
      tytul: "Organizacja",
      linki: [
        { href: "/panel/soltys/kalendarz", label: "Kalendarz", highlight: true },
        { href: "/panel/soltys/rezerwacje", label: "Rezerwacje sal", badge: l.rezerwacje || undefined },
        { href: "/panel/soltys/swietlica", label: "Świetlica" },
        { href: "/panel/soltys/dokumenty", label: "Generator dokumentów" },
      ],
    },
    {
      id: "admin",
      tytul: "Administracja",
      linki: [
        { href: "/panel/soltys/zgloszenia", label: "Zgłoszenia", badge: l.zgloszenia || undefined },
        { href: "/panel/soltys/samorzad", label: "Przewodnik samorządowy" },
        { href: "/panel/soltys/informacje-lokalne", label: "Informacje dla mieszkańców" },
        { href: "/panel/soltys/pomoc", label: "Pomoc sołtysa" },
        { href: "/pomoc?rola=soltys", label: "Centrum pomocy" },
      ],
    },
  ];
}

export async function SoltysNawigacja() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/logowanie?next=/panel/soltys");

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
      })}
      ariaLabel="Panel sołtysa"
    />
  );
}
