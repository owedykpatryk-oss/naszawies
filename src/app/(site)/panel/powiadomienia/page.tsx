import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
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

  return (
    <main>
      <h1 className="font-serif text-3xl text-green-950">Powiadomienia</h1>
      <p className="mt-2 text-sm text-stone-600">
        Wiadomości w aplikacji (tabela <code className="rounded bg-stone-100 px-1 text-xs">notifications</code>). Kanał
        e-mail — osobna integracja w przyszłej wersji.
      </p>
      <div className="mt-8">
        <PowiadomieniaLista wpisy={wpisy} />
      </div>
    </main>
  );
}
