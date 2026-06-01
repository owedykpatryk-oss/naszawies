import { cookies, headers } from "next/headers";
import { DolnaNawigacjaWarunkowa } from "@/components/marka/dolna-nawigacja-warunkowa";
import { NaglowekWarunkowy } from "@/components/marka/naglowek-warunkowy";
import { TrybSeniorProvider } from "@/components/ui/tryb-senior-provider";
import { maCiasteczkaSesjiSupabaseSerwer } from "@/lib/auth/ciasteczka-sesji";
import { czyStronaBezNaglowkaWitryny, czyStronaMapyImmersyjna } from "@/lib/auth/sciezki-strony-auth";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { sciezkaKreatoraGrafikiDlaUzytkownika } from "@/lib/grafika/sciezka-kreatora";
import { pobierzKluczeDolnejNawigacjiZMeta, type KluczDolnejNawigacji } from "@/lib/uzytkownik/preferencje-ui";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const LINKI_PUBLICZNE = [
  { href: "/rynek", label: "Rynek lokalny" },
  { href: "/szukaj", label: "Szukaj wsi" },
  { href: "/pomoc", label: "Pomoc" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

function linkiPoZalogowaniu(sciezkaKreatora: string) {
  return [
    { href: "/mapa", label: "Mapa wsi" },
    { href: "/rynek", label: "Rynek lokalny" },
    { href: "/szukaj", label: "Szukaj wsi" },
    { href: "/panel", label: "Panel" },
    { href: sciezkaKreatora, label: "Kreator plakatów" },
    { href: "/pomoc", label: "Pomoc" },
    { href: "/kontakt", label: "Kontakt" },
  ] as const;
}

function pomijaNaglowekWitryny(pathname: string): boolean {
  return czyStronaBezNaglowkaWitryny(pathname);
}

/** Nawigacja zależy od sesji — bez cache między żądaniami. */
export const dynamic = "force-dynamic";

export default async function LayoutWitryny({ children }: { children: React.ReactNode }) {
  cookies();
  const pathname = headers().get("x-pathname") ?? "";
  const bezNaglowka = pomijaNaglowekWitryny(pathname);
  const mapaImmersyjna = czyStronaMapyImmersyjna(pathname);

  let linkiGlowne: { href: string; label: string }[] = [...LINKI_PUBLICZNE];
  let linkiAkcje: { href: string; label: string }[] = [
    { href: "/o-nas", label: "O nas" },
    { href: "/logowanie", label: "Logowanie" },
    { href: "/rejestracja", label: "Rejestracja" },
  ];
  let logoHref = "/";
  let zalogowany = false;
  let kluczeDolnejNawigacji: KluczDolnejNawigacji[] | undefined;

  if (maCiasteczkaSesjiSupabaseSerwer()) {
    try {
      const user = await pobierzUzytkownikaSerwer();
      if (user) {
        zalogowany = true;
        kluczeDolnejNawigacji = pobierzKluczeDolnejNawigacjiZMeta(
          user.user_metadata as Record<string, unknown>,
          true,
        );
        if (!bezNaglowka) {
          const supabase = utworzKlientaSupabaseSerwer();
          const sciezkaKreatora = await sciezkaKreatoraGrafikiDlaUzytkownika(supabase, user.id);
          linkiGlowne = [...linkiPoZalogowaniu(sciezkaKreatora)];
          linkiAkcje = [
            { href: "/panel/profil", label: "Profil" },
            { href: "/panel/powiadomienia", label: "Powiadomienia" },
            { href: "/wyloguj", label: "Wyloguj" },
          ];
          logoHref = "/mapa";
        }
      }
    } catch {
      // brak env — nagłówek z domyślnymi linkami
    }
  }

  return (
    <TrybSeniorProvider>
      <div className="site-tlo-aplikacji min-h-[100dvh] min-w-0 overflow-x-hidden text-stone-900 [padding-left:max(1rem,env(safe-area-inset-left))] [padding-right:max(1rem,env(safe-area-inset-right))]">
        {!bezNaglowka ? (
          <NaglowekWarunkowy linkiGlowne={linkiGlowne} linkiAkcje={linkiAkcje} logoHref={logoHref} />
        ) : null}
        <div
          className={
            mapaImmersyjna
              ? "min-h-0 pb-0 [padding-bottom:var(--dolna-naw-offset,0px)]"
              : "pb-8 sm:pb-10 [padding-bottom:calc(2rem+var(--app-bottom-bar-offset,0px)+var(--dolna-naw-offset,0px))] sm:[padding-bottom:calc(2.5rem+var(--dolna-naw-offset,0px))]"
          }
        >
          {children}
        </div>
        <DolnaNawigacjaWarunkowa zalogowany={zalogowany} kluczeDolnejNawigacji={kluczeDolnejNawigacji} />
      </div>
    </TrybSeniorProvider>
  );
}
