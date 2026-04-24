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
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-stone-50 text-stone-900">
      <NaglowekStrony linkiPrawe={linkiPrawe} />
      {children}
    </div>
  );
}
