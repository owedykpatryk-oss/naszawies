import { NaglowekStrony } from "@/components/marka/naglowek-strony";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export default async function LayoutWitryny({ children }: { children: React.ReactNode }) {
  let linkiGlowne: { href: string; label: string }[] = [
    { href: "/szukaj", label: "Szukaj wsi" },
    { href: "/mapa", label: "Mapa wsi" },
    { href: "/kontakt", label: "Kontakt" },
  ];
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
      linkiGlowne = [
        { href: "/panel", label: "Panel" },
        { href: "/szukaj", label: "Szukaj wsi" },
        { href: "/mapa", label: "Mapa wsi" },
        { href: "/kontakt", label: "Kontakt" },
      ];
      linkiAkcje = [
        { href: "/panel/profil", label: "Profil" },
        { href: "/panel/powiadomienia", label: "Powiadomienia" },
      ];
    }
  } catch {
    // brak env — nagłówek z domyślnymi linkami
  }

  return (
    <div className="min-h-[100dvh] min-w-0 overflow-x-hidden bg-stone-50 text-stone-900 [padding-left:max(1rem,env(safe-area-inset-left))] [padding-right:max(1rem,env(safe-area-inset-right))] [padding-bottom:max(0.25rem,env(safe-area-inset-bottom))]">
      <NaglowekStrony linkiGlowne={linkiGlowne} linkiAkcje={linkiAkcje} />
      <div className="pb-8 sm:pb-10">{children}</div>
    </div>
  );
}
