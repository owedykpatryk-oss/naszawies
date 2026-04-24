import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { ProfilWsiSoltysKlient, type WiesDoEdycji } from "./profil-wsi-klient";

export const metadata: Metadata = {
  title: "Profil wsi (sołtys)",
};

export default async function SoltysMojaWiesPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/moja-wies");
  }
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (villageIds.length === 0) {
    return (
      <main>
        <h1 className="font-serif text-3xl text-green-950">Profil wsi</h1>
        <p className="mt-2 text-sm text-stone-600">Nie masz jeszcze przypisanej wsi w roli sołtysa lub współadmina.</p>
        <p className="mt-4 text-sm text-stone-600">
          <Link href="/panel/soltys" className="text-green-800 underline">
            ← Przegląd panelu
          </Link>
        </p>
      </main>
    );
  }

  const { data: wiersze } = await supabase
    .from("villages")
    .select("id, name, voivodeship, county, commune, slug, description, website, cover_image_url")
    .in("id", villageIds)
    .order("name", { ascending: true });

  const wies: WiesDoEdycji[] = (wiersze ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    voivodeship: r.voivodeship,
    county: r.county,
    commune: r.commune,
    slug: r.slug,
    description: r.description,
    website: r.website,
    cover_image_url: r.cover_image_url,
  }));

  return (
    <main>
      <h1 className="font-serif text-3xl text-green-950">Profil wsi</h1>
      <p className="mt-2 text-sm text-stone-600">
        Uzupełnij opis, linki i ewent. baner — widać to na publicznej stronie wsi. Nazwa, gmina i województwo pochodzą z
        rejestru TERYT; zmiana identyfikatora miejscowości jest po stronie administratora platformy.
      </p>
      <p className="mt-2 text-sm text-amber-900/90">
        Nie ma Twojej wsi w wyszukiwarce? <strong>Administrator</strong> może dodać ją w panelu (dane z TERYT, konto
        sołtysa):{" "}
        <Link href="/panel/admin" className="font-medium text-green-900 underline">
          Panel administratora
        </Link>
        . Możliwy jest też <strong>import całej listy miejscowości</strong> z plików GUS w projekcie (por. dokumentacja
        w repozytorium).
      </p>
      <ProfilWsiSoltysKlient wies={wies} />
    </main>
  );
}
