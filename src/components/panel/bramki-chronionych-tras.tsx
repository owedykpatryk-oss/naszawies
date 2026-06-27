import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { wymagajAkceptacjiPrawnejJesliTrzeba } from "@/app/(site)/panel/akceptacja-regulaminu/akcje-akceptacja";
import { wymagajOnboardinguJesliTrzeba } from "@/app/(site)/panel/onboarding/akcje-onboarding";
import { bezpiecznaSciezkaNastepna } from "@/lib/auth/bezpieczna-sciezka-nastepna";
import { sciezkaPowrotuZNaglowkow } from "@/lib/auth/sciezka-powrotu-naglowki";
import { urlLogowaniaZPowrotem } from "@/lib/auth/sciezki-chronione";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";

/** Wspólne bramki dla /mapa, /transport, /grafika, /wybierz-wies (sesja + RODO + onboarding). */
export async function BramkiChronionychTras() {
  const sciezka = headers().get("x-pathname") ?? "/";
  const user = await pobierzUzytkownikaSerwer();
  if (!user) {
    redirect(urlLogowaniaZPowrotem(sciezkaPowrotuZNaglowkow(sciezka)));
  }

  /** redirect() w Suspense powoduje fałszywy błąd RSC w konsoli produkcyjnej — sprawdzenia synchronicznie w rodzicu. */
  const next = bezpiecznaSciezkaNastepna(sciezka);
  await wymagajAkceptacjiPrawnejJesliTrzeba(sciezka, next);
  const nextRaw = headers().get("x-next-onboarding");
  const nextOnboarding = nextRaw ? bezpiecznaSciezkaNastepna(nextRaw) : sciezka;
  await wymagajOnboardinguJesliTrzeba(sciezka, nextOnboarding);

  return null;
}
