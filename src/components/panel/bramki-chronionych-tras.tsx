import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { BramkaOnboardingu } from "@/components/panel/bramka-onboardingu";
import { BramkaZgodPrawnych } from "@/components/panel/bramka-zgod-prawnych";
import { urlLogowaniaZPowrotem } from "@/lib/auth/sciezki-chronione";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";

/** Wspólne bramki dla /mapa, /transport, /grafika, /wybierz-wies (sesja + RODO + onboarding). */
export async function BramkiChronionychTras() {
  const sciezka = headers().get("x-pathname") ?? "/";
  const user = await pobierzUzytkownikaSerwer();
  if (!user) {
    redirect(urlLogowaniaZPowrotem(sciezka));
  }

  return (
    <>
      <Suspense fallback={null}>
        <BramkaZgodPrawnych />
      </Suspense>
      <Suspense fallback={null}>
        <BramkaOnboardingu />
      </Suspense>
    </>
  );
}
