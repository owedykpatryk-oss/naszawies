import type { Metadata } from "next";
import Link from "next/link";
import { PanelStronaModulu } from "@/components/panel/panel-strona-modulu";
import { pobierzVillageIdsModeracjiTresci } from "@/lib/panel/rola-moderacji";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";

export const metadata: Metadata = {
  title: "Panel rady sołeckiej — moderacja",
};

export default async function RadaPanelPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaPanelu();

  const villageIds = await pobierzVillageIdsModeracjiTresci(supabase, user.id);
  if (villageIds.length === 0) {
    return (
      <PanelStronaModulu
        etykieta="Rada sołecka"
        tytul="Rada sołecka"
        hrefPowrotu="/panel/mieszkaniec"
        etykietaPowrotu="← Panel mieszkańca"
        opis="Nie masz roli rady sołeckiej ani współadmina w żadnej wsi. Sołtys nie moderuje tu ogłoszeń — to zadanie rady."
        dzieci={null}
      />
    );
  }

  return (
    <PanelStronaModulu
      etykieta="Rada sołecka"
      tytul="Moderacja treści — rada sołecka"
      hrefPowrotu="/panel/mieszkaniec"
      etykietaPowrotu="← Panel mieszkańca"
      opis="Akceptacja ogłoszeń, rynku, fotokroniki i raportów społeczności. Sołtys zajmuje się wyłącznie sprawami sołeckimi (wnioski, rezerwacje, zgłoszenia, profil wsi)."
      dzieci={
        <ul className="lista-wierszy-panelu space-y-3">
          <li>
            <Link href="/panel/soltys" className="font-medium text-emerald-900 underline-offset-2 hover:underline">
              Kolejka moderacji (posty, rynek, pomoc)
            </Link>
          </li>
          <li>
            <Link
              href="/panel/soltys/spolecznosc/moderacja"
              className="font-medium text-emerald-900 underline-offset-2 hover:underline"
            >
              Raporty treści i dyskusje
            </Link>
          </li>
          <li>
            <Link
              href="/panel/soltys/wiadomosci-lokalne"
              className="font-medium text-emerald-900 underline-offset-2 hover:underline"
            >
              Wiadomości lokalne do zatwierdzenia
            </Link>
          </li>
          <li>
            <Link
              href="/panel/soltys/fotokronika"
              className="font-medium text-emerald-900 underline-offset-2 hover:underline"
            >
              Fotokronika — zdjęcia oczekujące
            </Link>
          </li>
        </ul>
      }
    />
  );
}
