import { NaglowekStrony } from "@/components/marka/naglowek-strony";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export default async function LayoutWitryny({ children }: { children: React.ReactNode }) {
  let linkiPrawe: { href: string; label: string }[] = [
    { href: "/szukaj", label: "Szukaj wsi" },
    { href: "/mapa", label: "Mapa wsi" },
    { href: "/logowanie", label: "Logowanie" },
    { href: "/rejestracja", label: "Rejestracja" },
  ];

  try {
    const supabase = utworzKlientaSupabaseSerwer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      linkiPrawe = [
        { href: "/panel", label: "Panel" },
        { href: "/szukaj", label: "Szukaj wsi" },
        { href: "/mapa", label: "Mapa wsi" },
        { href: "/kontakt", label: "Kontakt" },
      ];
    }
  } catch {
    // brak env — nagłówek z domyślnymi linkami
  }

  return (
    <div className="min-h-[100dvh] min-w-0 overflow-x-hidden bg-stone-50 text-stone-900 [padding-left:max(1rem,env(safe-area-inset-left))] [padding-right:max(1rem,env(safe-area-inset-right))] [padding-bottom:max(0.25rem,env(safe-area-inset-bottom))]">
      <NaglowekStrony linkiPrawe={linkiPrawe} />
      {children}
    </div>
  );
}
