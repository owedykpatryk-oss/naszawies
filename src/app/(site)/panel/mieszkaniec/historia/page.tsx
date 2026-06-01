import type { Metadata } from "next";
import Link from "next/link";
import { HistoriaMieszkaniecKlient } from "@/components/panel/mieszkaniec/historia-mieszkaniec-klient";
import { PanelStronaMieszkaneca } from "@/components/panel/panel-strona-mieszkaneca";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export const metadata: Metadata = {
  title: "Historia wsi — czytaj i zgłoś wspomnienie",
  description: "Kronika miejscowości na profilu publicznym oraz zgłaszanie wspomnień do akceptacji sołtysa.",
};

export default async function MieszkaniecHistoriaPage() {
  const user = await pobierzUzytkownikaPanelu();
  const supabase = utworzKlientaSupabaseSerwer();

  const { data: roleRows } = await supabase
    .from("user_village_roles")
    .select("village_id, status, villages(name, slug, voivodeship, county, commune)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const { data: followRows } = await supabase
    .from("user_follows")
    .select("village_id, villages(name, slug, voivodeship, county, commune)")
    .eq("user_id", user.id);

  const mapa = new Map<
    string,
    { id: string; name: string; voivodeship: string; county: string; commune: string; slug: string }
  >();
  for (const r of roleRows ?? []) {
    const v = pojedynczaWies<{
      name: string;
      slug: string;
      voivodeship: string;
      county: string;
      commune: string;
    }>(r.villages);
    if (v) mapa.set(r.village_id, { id: r.village_id, ...v });
  }
  for (const f of followRows ?? []) {
    if (mapa.has(f.village_id)) continue;
    const v = pojedynczaWies<{
      name: string;
      slug: string;
      voivodeship: string;
      county: string;
      commune: string;
    }>(f.villages);
    if (v) mapa.set(f.village_id, { id: f.village_id, ...v });
  }

  const wsie = Array.from(mapa.values()).sort((a, b) => a.name.localeCompare(b.name, "pl"));

  return (
    <PanelStronaMieszkaneca
      tytul="Historia wsi"
      opis={
        <>
          Czytaj kronikę na publicznym profilu miejscowości. Możesz też zgłosić wspomnienie — sołtys opublikuje je po
          weryfikacji w{" "}
          <Link href="/panel/soltys/spolecznosc/historia" className="font-medium text-green-800 underline">
            panelu kroniki
          </Link>
          .
        </>
      }
      dzieci={<HistoriaMieszkaniecKlient wsie={wsie} />}
    />
  );
}
