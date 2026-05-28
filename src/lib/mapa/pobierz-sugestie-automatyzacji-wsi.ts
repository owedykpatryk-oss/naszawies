import type { SupabaseClient } from "@supabase/supabase-js";
import {
  transportAutobusSkonfigurowany,
  transportAutobusWlaczony,
  transportKolejWlaczony,
} from "@/lib/mapa/konfiguracja-automatyzacji";

export type AkcjaSugestiiMapy = "osm" | "transport" | "granice" | "transport_panel" | null;

export type SugestiaAutomatyzacjiMapy = {
  klucz: string;
  waga: number;
  tytul: string;
  opis: string;
  akcja: AkcjaSugestiiMapy;
};

const KATEGORIE_TRANSPORT = ["przystanek", "stacja_kolejowa"] as const;

export async function pobierzSugestieAutomatyzacjiWsi(
  supabase: SupabaseClient,
  villageId: string,
): Promise<SugestiaAutomatyzacjiMapy[]> {
  const sugestie: SugestiaAutomatyzacjiMapy[] = [];

  const [{ data: wies }, { data: pois }, { data: sync }, { count: liczbaAdresow }, { count: liczbaGeoKontekst }] =
    await Promise.all([
      supabase
        .from("villages")
        .select("id, name, boundary_geojson, latitude, longitude")
        .eq("id", villageId)
        .maybeSingle(),
      supabase.from("pois").select("category").eq("village_id", villageId),
      supabase
        .from("transport_sync_state")
        .select("last_planned_sync_at, last_bus_sync_at")
        .eq("village_id", villageId)
        .maybeSingle(),
      supabase
        .from("address_points")
        .select("id", { count: "exact", head: true })
        .eq("village_id", villageId),
      supabase
        .from("geo_context_features")
        .select("id", { count: "exact", head: true })
        .eq("village_id", villageId),
    ]);

  if (!wies) return sugestie;

  const lat = wies.latitude != null ? Number(wies.latitude) : NaN;
  const lon = wies.longitude != null ? Number(wies.longitude) : NaN;
  const maGps = Number.isFinite(lat) && Number.isFinite(lon);

  const licznik = new Map<string, number>();
  for (const p of pois ?? []) {
    const c = p.category ?? "";
    licznik.set(c, (licznik.get(c) ?? 0) + 1);
  }
  const przystanki = licznik.get("przystanek") ?? 0;
  const stacje = licznik.get("stacja_kolejowa") ?? 0;
  const wszystkiePoi = (pois ?? []).length;

  if (!wies.boundary_geojson) {
    sugestie.push({
      klucz: "granica",
      waga: 90,
      tytul: "Brak obrysu wsi na mapie",
      opis: "Granica z PRG uzupełnia się automatycznie (cron co 2–4 h). Otwórz mapę publiczną — przy wielu brakach uruchomi się sync w tle.",
      akcja: "granice",
    });
  }

  if (!maGps) {
    sugestie.push({
      klucz: "gps",
      waga: 100,
      tytul: "Brak współrzędnych wsi",
      opis: "Bez punktu GPS nie zadziała import OSM, transport ani przystanki z GTFS. Poproś administratora o uzupełnienie współrzędnych.",
      akcja: null,
    });
    return sugestie.sort((a, b) => b.waga - a.waga);
  }

  if (wies.boundary_geojson && (liczbaAdresow ?? 0) === 0) {
    sugestie.push({
      klucz: "adresy_kin",
      waga: 55,
      tytul: "Brak adresów urzędowych (Geoportal KIN)",
      opis: "Cron pobiera punkty adresowe z Krajowej Integracji Numeracji. Upewnij się, że wsi ma kod TERYT/SIMC — sync co kilka dni.",
      akcja: null,
    });
  }

  if ((liczbaGeoKontekst ?? 0) === 0) {
    sugestie.push({
      klucz: "geo_kontekst",
      waga: 45,
      tytul: "Brak nazw geograficznych (PRNG)",
      opis: "Rzeki, wzgórza, lasy z Państwowego Rejestru Nazw — uzupełnia cron (Geoportal WFS). Zobacz profil wsi → dane referencyjne.",
      akcja: null,
    });
  }

  if (przystanki === 0) {
    sugestie.push({
      klucz: "przystanek",
      waga: 85,
      tytul: "Dodaj przystanki autobusowe (PKS)",
      opis: "Jednym kliknięciem pobierz przystanki z OpenStreetMap. Przy włączonym GTFS cron może też dopisać pinezki z rozkładu.",
      akcja: "osm",
    });
  }

  if (stacje === 0) {
    sugestie.push({
      klucz: "stacja",
      waga: 80,
      tytul: "Dodaj stację / przystanek kolejowy (PKP)",
      opis: "Import z OSM często znajduje railway=station. Potem w panelu Transport przypisz stację do odjazdów PKP.",
      akcja: "osm",
    });
  }

  if (wszystkiePoi < 4) {
    sugestie.push({
      klucz: "malopoi",
      waga: 70,
      tytul: "Mało punktów na mapie",
      opis: "Szkoła, kościół, sklep, OSP — większość wsi ma je w OSM. Użyj „Uzupełnij z OSM” (promień ~2,8 km).",
      akcja: "osm",
    });
  }

  const kolejWl = transportKolejWlaczony();
  const busWl = transportAutobusWlaczony();
  const busOk = transportAutobusSkonfigurowany();

  if (!kolejWl && !busWl) {
    sugestie.push({
      klucz: "transport_env",
      waga: 50,
      tytul: "Rozkłady jazdy wyłączone na serwerze",
      opis: "Administrator musi ustawić TRANSPORT_SYNC_ENABLED + PKP_PLK_API_KEY oraz/lub TRANSPORT_BUS_SYNC_ENABLED + GTFS lub e-podróżnik.",
      akcja: "transport_panel",
    });
  } else {
    const lastBus = sync?.last_bus_sync_at ? Date.parse(sync.last_bus_sync_at) : 0;
    const lastKolej = sync?.last_planned_sync_at ? Date.parse(sync.last_planned_sync_at) : 0;
    const staroscH = 12;
    const granica = Date.now() - staroscH * 60 * 60 * 1000;

    if (busWl && busOk && (!lastBus || lastBus < granica)) {
      sugestie.push({
        klucz: "odswiez_bus",
        waga: 75,
        tytul: "Odśwież rozkład autobusów",
        opis: "Cache PKS/GTFS nie był aktualizowany od ponad 12 h (lub nigdy). Kliknij — pobierze odjazdy i dopasuje do przystanków.",
        akcja: "transport",
      });
    }

    if (kolejWl && stacje > 0 && (!lastKolej || lastKolej < granica)) {
      sugestie.push({
        klucz: "odswiez_pkp",
        waga: 74,
        tytul: "Odśwież rozkład PKP",
        opis: "Pobierz planowane i opóźnione kursy dla stacji przypisanej do wsi.",
        akcja: "transport",
      });
    }

    if ((kolejWl || busWl) && (przystanki > 0 || stacje > 0)) {
      sugestie.push({
        klucz: "transport_mapa",
        waga: 40,
        tytul: "Sprawdź mapowanie stacji PKP",
        opis: "W panelu Transport możesz ręcznie poprawić stację, jeśli automat nie trafił w właściwą.",
        akcja: "transport_panel",
      });
    }
  }

  const maTransportPoi = KATEGORIE_TRANSPORT.some((k) => (licznik.get(k) ?? 0) > 0);
  if (maTransportPoi && (kolejWl || busOk)) {
    sugestie.push({
      klucz: "cron_info",
      waga: 10,
      tytul: "Cron co 4 godziny",
      opis: "Serwer automatycznie: POI z OSM, granice PRG, odjazdy PKP i autobusów (limity w .env).",
      akcja: null,
    });
  }

  const unikalne = new Map<string, SugestiaAutomatyzacjiMapy>();
  for (const s of sugestie) {
    const prev = unikalne.get(s.klucz);
    if (!prev || s.waga > prev.waga) unikalne.set(s.klucz, s);
  }

  return Array.from(unikalne.values()).sort((a, b) => b.waga - a.waga);
}
