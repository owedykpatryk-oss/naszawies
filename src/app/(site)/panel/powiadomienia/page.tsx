import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NaglowekModuluPanelu } from "@/components/pomoc/naglowek-modulu-panelu";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { PowiadomieniaPushKlient } from "@/components/pwa/powiadomienia-push-klient";
import { IosPushOnboarding } from "@/components/pwa/ios-push-onboarding";
import { PowiadomieniaLista, type PowiadomienieWiersz } from "./powiadomienia-lista";

export const metadata: Metadata = {
  title: "Powiadomienia",
};

export default async function PowiadomieniaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    redirect("/logowanie?next=/panel/powiadomienia");
  }

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, link_url, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const wpisy = (data ?? []) as PowiadomienieWiersz[];
  const nieprzeczytane = wpisy.filter((w) => !w.is_read).length;

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
      <div className="mt-8">
        <PowiadomieniaLista wpisy={wpisy} />
      </div>
    </main>
  );
}
