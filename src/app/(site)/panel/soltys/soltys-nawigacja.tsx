import { redirect } from "next/navigation";
import { NawigacjaPaneluGrupowana } from "@/components/panel/nawigacja-panelu-grupowana";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzLicznikiOczekujacychSoltysa, lacznaLiczbaZadanSoltysa } from "@/lib/panel/liczniki-oczekujacych-soltysa";
import {
  grupyNawigacjiSoltysa,
  SZYBKIE_LINKI_SOLTYS,
} from "@/lib/panel/konfiguracja-nawigacji-modulow";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export async function SoltysNawigacja() {
  const user = await pobierzUzytkownikaSerwer();
  if (!user) redirect("/logowanie?next=/panel/soltys");

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
