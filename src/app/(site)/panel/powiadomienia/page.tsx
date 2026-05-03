import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { PowiadomieniaPushKlient } from "@/components/pwa/powiadomienia-push-klient";
import { PowiadomieniaLista, type PowiadomienieWiersz } from "./powiadomienia-lista";

export const metadata: Metadata = {
  title: "Powiadomienia",
};

export default async function PowiadomieniaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/powiadomienia");
  }

  const { data } = await supabase
    .from("notifications")
    .select("id, title, body, link_url, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const wpisy = (data ?? []) as PowiadomienieWiersz[];
  const nieprzeczytane = wpisy.filter((w) => !w.is_read).length;

  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel" className="text-green-800 underline">
          ← Panel
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Powiadomienia</h1>
      <p className="mt-2 text-sm text-stone-600">
        Wiadomości w aplikacji (tabela <code className="rounded bg-stone-100 px-1 text-xs">notifications</code>). Opcjonalnie
        włącz <strong>powiadomienia push</strong> w przeglądarce — wtedy część zdarzeń trafia też na telefon (wymaga pary
        kluczy VAPID na serwerze). Kanał e-mail — osobna integracja w przyszłej wersji.
        {nieprzeczytane > 0 ? (
          <>
            {" "}
            <span className="font-medium text-green-900">
              Nieprzeczytane: {nieprzeczytane}
            </span>
            .
          </>
        ) : null}
      </p>
      <PowiadomieniaPushKlient />
      <div className="mt-8">
        <PowiadomieniaLista wpisy={wpisy} />
      </div>
    </main>
  );
}
