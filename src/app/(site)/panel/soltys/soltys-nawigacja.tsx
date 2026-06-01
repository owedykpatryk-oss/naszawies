import { NawigacjaPaneluGrupowana } from "@/components/panel/nawigacja-panelu-grupowana";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzLicznikiOczekujacychSoltysa, lacznaLiczbaZadanSoltysa } from "@/lib/panel/liczniki-oczekujacych-soltysa";
import {
  grupyNawigacjiSoltysa,
  SZYBKIE_LINKI_SOLTYS,
} from "@/lib/panel/konfiguracja-nawigacji-modulow";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export async function SoltysNawigacja() {
  const user = await pobierzUzytkownikaPanelu();
  const supabase = utworzKlientaSupabaseSerwer();
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  const liczniki =
    villageIds.length > 0 ? await pobierzLicznikiOczekujacychSoltysa(supabase, villageIds) : null;
  const lacznie = liczniki ? lacznaLiczbaZadanSoltysa(liczniki) : 0;

  return (
    <NawigacjaPaneluGrupowana
      grupy={grupyNawigacjiSoltysa(liczniki, lacznie)}
      szybkieLinki={SZYBKIE_LINKI_SOLTYS}
      ariaLabel="Panel sołtysa"
    />
  );
}
