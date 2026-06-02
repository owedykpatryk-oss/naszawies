import type { Metadata } from "next";

import { NaglowekModuluPanelu } from "@/components/pomoc/naglowek-modulu-panelu";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { PowiadomieniaPushKlient } from "@/components/pwa/powiadomienia-push-klient";
import { IosPushOnboarding } from "@/components/pwa/ios-push-onboarding";
import { PowiadomieniaLista, type PowiadomienieWiersz } from "./powiadomienia-lista";
import { PreferencjePowiadomienKlient } from "./preferencje-powiadomien-klient";
import { pobierzPreferencjePowiadomienSerwer } from "./akcje-preferencje";
import type { PreferencjaPowiadomieniaWiersz } from "@/lib/powiadomienia/typy-powiadomien-preferences";

export const metadata: Metadata = {
  title: "Powiadomienia",
};

export default async function PowiadomieniaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaPanelu();

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, link_url, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const wpisy = (data ?? []) as PowiadomienieWiersz[];
  const nieprzeczytane = wpisy.filter((w) => !w.is_read).length;
  const preferencje = (await pobierzPreferencjePowiadomienSerwer()) as PreferencjaPowiadomieniaWiersz[];

  return (
    <main>
      <NaglowekModuluPanelu
        etykieta="Konto"
        tytul="Powiadomienia"
        hrefPowrotu="/panel"
        etykietaPowrotu="← Panel"
        opis={
          <>
            Tutaj zbiera się skrzynka wiadomości z portalu — użyj filtrów (wnioski, zgłoszenia, pozostałe), żeby szybciej
            znaleźć wpis. Możesz też włączyć powiadomienia w przeglądarce na telefonie — sekcja niżej.
            {nieprzeczytane > 0 ? (
              <>
                {" "}
                <span className="font-medium text-green-900">Nieprzeczytane: {nieprzeczytane}</span>.
              </>
            ) : null}
          </>
        }
      />
      <IosPushOnboarding />
      <PowiadomieniaPushKlient />
      <PreferencjePowiadomienKlient zapisane={preferencje} />
      <div className="mt-8">
        <PowiadomieniaLista wpisy={wpisy} />
      </div>
    </main>
  );
}
