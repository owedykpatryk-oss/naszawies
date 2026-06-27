import { Suspense } from "react";
import { headers } from "next/headers";
import { PanelNaglowekZLogo } from "@/components/panel/panel-naglowek-z-logo";
import { FeedbackPromptPanelKlient } from "@/components/feedback/feedback-prompt-panel-klient";
import { finalizujPowiazanieZRejestracji } from "@/lib/auth/finalizuj-powiazanie-z-rejestracji";
import { pobierzUzytkownikaPanelu, pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzMetadaneNaglowkaPaneluCache } from "@/lib/panel/metadane-naglowka-panelu";
import { pobierzKluczePanelNawigacjiZMeta } from "@/lib/uzytkownik/preferencje-ui";
import { bezpiecznaSciezkaNastepna } from "@/lib/auth/bezpieczna-sciezka-nastepna";
import { wymagajAkceptacjiPrawnejJesliTrzeba } from "@/app/(site)/panel/akceptacja-regulaminu/akcje-akceptacja";
import { wymagajOnboardinguJesliTrzeba } from "@/app/(site)/panel/onboarding/akcje-onboarding";

/** Wymaga sesji — brak prerendera statycznego, żeby hooki miały kontekst żądania. */
export const dynamic = "force-dynamic";

async function NaglowekPanelu() {
  const user = await pobierzUzytkownikaSerwer();
  if (!user) {
    return (
      <PanelNaglowekZLogo pokazLinkSoltysa={false} liczbaWiadomosciNieprzeczytanych={0} pokazAdmin={false} />
    );
  }

  const meta = await pobierzMetadaneNaglowkaPaneluCache(user.id);
  const kluczePanelu = pobierzKluczePanelNawigacjiZMeta(user.user_metadata as Record<string, unknown>, {
    pokazSoltysa: meta.pokazLinkSoltysa,
    pokazAdmin: meta.pokazAdmin,
  });
  return (
    <PanelNaglowekZLogo
      pokazLinkSoltysa={meta.pokazLinkSoltysa}
      liczbaWiadomosciNieprzeczytanych={meta.liczbaWiadomosciNieprzeczytanych}
      pokazAdmin={meta.pokazAdmin}
      kluczePanelu={kluczePanelu}
    />
  );
}

function NaglowekPaneluSzkielet() {
  return (
    <div className="no-print sticky top-0 z-40 -mx-4 mb-6 space-y-4 border-b border-stone-200/80 bg-[var(--nasza-tlo-panel)]/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="h-8 w-36 animate-pulse rounded-lg bg-stone-200/80" aria-hidden />
      <div className="h-10 animate-pulse rounded-xl bg-stone-200/60" aria-hidden />
    </div>
  );
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await pobierzUzytkownikaPanelu();
  const sciezka = headers().get("x-pathname") ?? "/panel";
  const ekranOnboardingu = sciezka === "/panel/onboarding" || sciezka.startsWith("/panel/onboarding/");
  const ekranAkceptacjiPrawnej =
    sciezka === "/panel/akceptacja-regulaminu" || sciezka.startsWith("/panel/akceptacja-regulaminu/");
  const pokazNaglowek = !ekranOnboardingu && !ekranAkceptacjiPrawnej;

  if (!ekranAkceptacjiPrawnej) {
    await wymagajAkceptacjiPrawnejJesliTrzeba(sciezka, bezpiecznaSciezkaNastepna(sciezka));
  }
  if (!ekranOnboardingu && !ekranAkceptacjiPrawnej) {
    await finalizujPowiazanieZRejestracji();
    const nextRaw = headers().get("x-next-onboarding");
    const nextOnboarding = nextRaw ? bezpiecznaSciezkaNastepna(nextRaw) : sciezka;
    await wymagajOnboardinguJesliTrzeba(sciezka, nextOnboarding);
  }

  return (
    <div className="panel-tlo min-h-[100dvh] min-w-0 overflow-x-hidden">
      <div className="panel-shell w-full min-w-0 py-6 text-stone-800 sm:py-8 lg:py-10">
        {pokazNaglowek ? (
          <Suspense fallback={<NaglowekPaneluSzkielet />}>
            <div className="no-print">
              <NaglowekPanelu />
            </div>
          </Suspense>
        ) : null}
        {!ekranAkceptacjiPrawnej && !ekranOnboardingu ? <FeedbackPromptPanelKlient /> : null}
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
