import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzSugestieAutomatyzacjiWsi } from "@/lib/mapa/pobierz-sugestie-automatyzacji-wsi";
import { pobierzPoiDoWeryfikacjiWsi } from "@/lib/mapa/pobierz-poi-do-weryfikacji-wsi";
import { pobierzPropozycjePoiWsi } from "@/lib/mapa/pobierz-propozycje-poi-wsi";
import { obliczKompletnoscMapyWsi } from "@/lib/mapa/oblicz-kompletnosc-mapy-wsi";
import { pobierzKatalogMozliwosciSoltysa } from "@/lib/panel/katalog-mozliwosci-soltysa";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { SoltysKatalogMozliwosci } from "@/components/panel/soltys-katalog-mozliwosci";
import { ProfilWsiSoltysKlient, type WiesDoEdycji } from "./profil-wsi-klient";
import type { PoiDoEdycjiKontaktu } from "@/components/panel/edytor-kontaktu-poi-soltys";

export const metadata: Metadata = {
  title: "Profil wsi (sołtys)",
};

export default async function SoltysMojaWiesPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/moja-wies");
  }
  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);
  if (villageIds.length === 0) {
    return (
      <PanelStronaSoltysa
        tytul="Profil wsi"
        opis="Nie masz jeszcze przypisanej wsi w roli sołtysa lub współadmina."
        dzieci={null}
      />
    );
  }

  const { data: wiersze } = await supabase
    .from("villages")
    .select(
      "id, name, voivodeship, county, commune, slug, description, website, cover_image_url, latitude, longitude, boundary_geojson, rynek_banner_text, rynek_banner_until",
    )
    .in("id", villageIds)
    .order("name", { ascending: true });

  const sugestieMapy: Record<string, Awaited<ReturnType<typeof pobierzSugestieAutomatyzacjiWsi>>> = {};
  for (const id of villageIds) {
    sugestieMapy[id] = await pobierzSugestieAutomatyzacjiWsi(supabase, id);
  }
  const katalogMozliwosci = await pobierzKatalogMozliwosciSoltysa(supabase, villageIds);
  const poiDoWeryfikacji = await pobierzPoiDoWeryfikacjiWsi(supabase, villageIds);
  const propozycjePoi = await pobierzPropozycjePoiWsi(supabase, villageIds);

  const [{ data: poisRaw }, { data: saleRaw }] = await Promise.all([
    supabase
      .from("pois")
      .select("id, village_id, name, category, phone, opening_hours, linked_hall_id, source")
      .in("village_id", villageIds)
      .order("category")
      .order("name"),
    supabase.from("halls").select("id, village_id, name").in("village_id", villageIds).order("name"),
  ]);

  const poisByVillage: Record<string, PoiDoEdycjiKontaktu[]> = {};
  for (const id of villageIds) poisByVillage[id] = [];
  for (const p of poisRaw ?? []) {
    const lista = poisByVillage[p.village_id];
    if (lista) {
      lista.push({
        id: p.id,
        name: p.name,
        category: p.category,
        phone: p.phone,
        opening_hours: p.opening_hours,
        linked_hall_id: p.linked_hall_id,
        source: p.source,
      });
    }
  }

  const saleByVillage: Record<string, { id: string; name: string }[]> = {};
  for (const id of villageIds) saleByVillage[id] = [];
  for (const s of saleRaw ?? []) {
    const lista = saleByVillage[s.village_id];
    if (lista) lista.push({ id: s.id, name: s.name });
  }

  const kompletnoscMapy: Record<string, ReturnType<typeof obliczKompletnoscMapyWsi>> = {};
  for (const id of villageIds) {
    const w = (wiersze ?? []).find((r) => r.id === id);
    const kategorie = (poisRaw ?? []).filter((p) => p.village_id === id).map((p) => p.category);
    kompletnoscMapy[id] = obliczKompletnoscMapyWsi({
      boundary_geojson: w?.boundary_geojson ?? null,
      latitude: w?.latitude != null ? Number(w.latitude) : null,
      longitude: w?.longitude != null ? Number(w.longitude) : null,
      kategoriePoi: kategorie,
      doWeryfikacji: (poiDoWeryfikacji[id] ?? []).length,
      oczekujacePropozycje: (propozycjePoi[id] ?? []).length,
    });
  }

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
    latitude: r.latitude != null ? Number(r.latitude) : null,
    longitude: r.longitude != null ? Number(r.longitude) : null,
  }));

  return (
    <PanelStronaSoltysa
      tytul="Profil wsi"
      opis={
        <>
          Uzupełnij opis, linki i ewent. baner — widać to na publicznej stronie wsi. Nazwa, gmina i województwo pochodzą z
          oficjalnego wykazu miejscowości; zmianę identyfikatora miejscowości ustala administrator platformy.
        </>
      }
      szeroki
      dzieci={
        <>
          <p className="mb-4 text-sm text-amber-900/90">
            Nie ma Twojej wsi w wyszukiwarce? <strong>Administrator</strong> może dodać ją w panelu wraz z kontem sołtysa:{" "}
            <Link href="/panel/admin" className="font-medium text-green-900 underline">
              Panel administratora
            </Link>
            .
          </p>
          <SoltysKatalogMozliwosci katalog={katalogMozliwosci} kompaktowy />
          <ProfilWsiSoltysKlient
            wies={wies}
            sugestieMapy={sugestieMapy}
            poisByVillage={poisByVillage}
            saleByVillage={saleByVillage}
            poiDoWeryfikacji={poiDoWeryfikacji}
            propozycjePoi={propozycjePoi}
            kompletnoscMapy={kompletnoscMapy}
          />
        </>
      }
    />
  );
}
