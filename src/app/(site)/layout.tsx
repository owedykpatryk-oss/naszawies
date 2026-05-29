import { NaglowekStrony } from "@/components/marka/naglowek-strony";
import { TrybSeniorProvider } from "@/components/ui/tryb-senior-provider";
import { sciezkaKreatoraGrafikiDlaUzytkownika } from "@/lib/grafika/sciezka-kreatora";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const LINKI_PUBLICZNE = [
  { href: "/rynek", label: "Rynek lokalny" },
  { href: "/logowanie?next=/szukaj", label: "Szukaj wsi" },
  { href: "/logowanie?next=/mapa", label: "Mapa" },
  { href: "/pomoc", label: "Pomoc" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

function linkiPoZalogowaniu(sciezkaKreatora: string) {
  return [
    { href: "/rynek", label: "Rynek lokalny" },
    { href: "/panel", label: "Panel" },
    { href: sciezkaKreatora, label: "Kreator plakatów" },
    { href: "/szukaj", label: "Szukaj wsi" },
    { href: "/mapa", label: "Mapa wsi" },
    { href: "/pomoc", label: "Pomoc" },
    { href: "/kontakt", label: "Kontakt" },
  ] as const;
}

export default async function LayoutWitryny({ children }: { children: React.ReactNode }) {
  let linkiGlowne: { href: string; label: string }[] = [...LINKI_PUBLICZNE];
  let linkiAkcje: { href: string; label: string }[] = [
    { href: "/o-nas", label: "O nas" },
    { href: "/logowanie", label: "Logowanie" },
    { href: "/rejestracja", label: "Rejestracja" },
  ];

  try {
    const supabase = utworzKlientaSupabaseSerwer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const sciezkaKreatora = await sciezkaKreatoraGrafikiDlaUzytkownika(supabase, user.id);
      linkiGlowne = [...linkiPoZalogowaniu(sciezkaKreatora)];
      linkiAkcje = [
        { href: "/panel/profil", label: "Profil" },
        { href: "/panel/powiadomienia", label: "Powiadomienia" },
      ];
    }
  } catch {
    // brak env — nagłówek z domyślnymi linkami
  }

  return (
    <TrybSeniorProvider>
      <div className="min-h-[100dvh] min-w-0 overflow-x-hidden bg-stone-50 text-stone-900 [padding-left:max(1rem,env(safe-area-inset-left))] [padding-right:max(1rem,env(safe-area-inset-right))] [padding-bottom:max(0.25rem,env(safe-area-inset-bottom))]">
        <NaglowekStrony linkiGlowne={linkiGlowne} linkiAkcje={linkiAkcje} />
        <div className="pb-8 sm:pb-10">{children}</div>
      </div>
    </TrybSeniorProvider>
  );
}
