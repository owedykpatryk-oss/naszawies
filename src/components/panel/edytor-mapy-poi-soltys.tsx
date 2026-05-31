"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import "leaflet/dist/leaflet.css";
import "@/components/mapa/mapa-wsi-leaflet.css";
import {
  dodajPoiNaMapieSoltys,
  przesunPoiNaMapieSoltys,
  usunPoiNaMapieSoltys,
} from "@/app/(site)/panel/soltys/akcje-edytor-mapy-soltysa";
import { KATEGORIE_PROPONOWALNE_POI } from "@/lib/mapa/kategorie-poi-bazowe";
import {
  emojiKategoriiPoi,
  etykietaKategoriiPoi,
  kolorObramowaniaPoi,
} from "@/lib/mapa/kategorie-poi";
import {
  type LeafletModul,
  type RodzajPodkladuMapyEdytor,
  ustawPodkladEdytoraMapy,
  utworzWarstwyPodkladu,
} from "@/lib/mapa/podklad-leaflet-wspolny";

export type PoiNaMapieEdycja = {
  id: string;
  villageId: string;
  name: string;
  category: string;
  latitude: number;
  longitude: number;
  source: string | null;
  description: string | null;
};

export type WiesDoMapyEdycji = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  boundaryGeojson: unknown | null;
};

type Props = {
  wsie: WiesDoMapyEdycji[];
  poisByVillage: Record<string, PoiNaMapieEdycja[]>;
};

const KATEGORIE_DODAWANIA = ["przystanek", ...KATEGORIE_PROPONOWALNE_POI.filter((k) => k !== "przystanek")] as const;

function ikonaPoiHtml(category: string, podswietlony = false): string {
  const emoji = emojiKategoriiPoi(category);
  const kolor = kolorObramowaniaPoi(category);
  const ring = podswietlony ? " box-shadow:0 0 0 3px #fbbf24;" : "";
  return `<div class="naszawies-marker-poi-inner" style="border-color:${kolor};${ring}">${emoji}</div>`;
}

export function EdytorMapyPoiSoltys({ wsie, poisByVillage }: Props) {
  const router = useRouter();
  const refEl = useRef<HTMLDivElement>(null);
  const refMapa = useRef<import("leaflet").Map | null>(null);
  const refL = useRef<LeafletModul | null>(null);
  const refWarstwaPoi = useRef<import("leaflet").LayerGroup | null>(null);
  const refWarstwaGranica = useRef<import("leaflet").LayerGroup | null>(null);
  const refWarstwaOczekujaca = useRef<import("leaflet").Marker | null>(null);
  const refMarkery = useRef<Map<string, import("leaflet").Marker>>(new Map());
  const refPodklad = useRef<ReturnType<typeof utworzWarstwyPodkladu> | null>(null);

  const [wiesId, ustawWiesId] = useState(wsie[0]?.id ?? "");
  const wies = useMemo(() => wsie.find((w) => w.id === wiesId) ?? wsie[0], [wsie, wiesId]);
  const pois = poisByVillage[wies?.id ?? ""] ?? [];

  const [podklad, ustawPodklad] = useState<RodzajPodkladuMapyEdytor>("satelita");
  const [tryb, ustawTryb] = useState<"dodaj" | "przesuwaj">("dodaj");
  const [kategoria, ustawKategoria] = useState<string>("przystanek");
  const [nazwa, ustawNazwa] = useState("");
  const [opis, ustawOpis] = useState("");
  const [oczekujaca, ustawOczekujaca] = useState<{ lat: number; lng: number } | null>(null);
  const [wybranyId, ustawWybranyId] = useState<string | null>(null);
  const [blad, ustawBlad] = useState("");
  const [komunikat, ustawKomunikat] = useState("");
  const [czek, startT] = useTransition();

  const refTryb = useRef(tryb);
  refTryb.current = tryb;

  const odswiezOczekujaca = useCallback((lat: number, lng: number) => {
    const L = refL.current;
    const map = refMapa.current;
    if (!L || !map) return;
    refWarstwaOczekujaca.current?.remove();
    const marker = L.marker([lat, lng], {
      draggable: true,
      icon: L.divIcon({
        className: "naszawies-leaflet-divicon",
        html: `<div style="width:28px;height:28px;border-radius:50%;background:#fbbf24;border:3px solid #92400e;box-shadow:0 2px 8px rgba(0,0,0,.35)"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      }),
    }).addTo(map);
    marker.on("dragend", () => {
      const p = marker.getLatLng();
      ustawOczekujaca({ lat: p.lat, lng: p.lng });
    });
    refWarstwaOczekujaca.current = marker;
  }, []);

  const narysujPoi = useCallback(
    (lista: PoiNaMapieEdycja[], podswietlId: string | null) => {
      const L = refL.current;
      const warstwa = refWarstwaPoi.current;
      const map = refMapa.current;
      if (!L || !warstwa || !map) return;

      refMarkery.current.forEach((m) => {
        m.remove();
      });
      refMarkery.current.clear();

      for (const p of lista) {
        const podsw = p.id === podswietlId;
        const marker = L.marker([p.latitude, p.longitude], {
          draggable: refTryb.current === "przesuwaj",
          icon: L.divIcon({
            className: "naszawies-leaflet-divicon",
            html: ikonaPoiHtml(p.category, podsw),
            iconSize: [36, 36],
            iconAnchor: [18, 20],
          }),
        }).addTo(warstwa);

        marker.bindTooltip(`${p.name} (${etykietaKategoriiPoi(p.category) ?? p.category})`, {
          direction: "top",
          offset: [0, -18],
        });

        marker.on("click", () => {
          ustawWybranyId(p.id);
        });

        marker.on("dragend", () => {
          if (refTryb.current !== "przesuwaj") return;
          const ll = marker.getLatLng();
          startT(async () => {
            const w = await przesunPoiNaMapieSoltys({
              poiId: p.id,
              latitude: ll.lat,
              longitude: ll.lng,
            });
            if ("blad" in w) ustawBlad(w.blad);
            else {
              ustawKomunikat(`Przesunięto: ${p.name}`);
              router.refresh();
            }
          });
        });

        refMarkery.current.set(p.id, marker);
      }
    },
    [router, startT],
  );

  useEffect(() => {
    narysujPoi(pois, wybranyId);
  }, [pois, wybranyId, tryb, narysujPoi]);

  useEffect(() => {
    const el = refEl.current;
    if (!el || !wies) return;
    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default as unknown as LeafletModul;
      if (cancelled || !refEl.current) return;
      refL.current = L;

      const map = L.map(el, { zoomControl: true, scrollWheelZoom: true, attributionControl: true });
      refMapa.current = map;

      const warstwy = utworzWarstwyPodkladu(L);
      refPodklad.current = warstwy;
      ustawPodkladEdytoraMapy(L, map, warstwy, podklad);

      const granica = L.layerGroup().addTo(map);
      refWarstwaGranica.current = granica;
      if (wies.boundaryGeojson) {
        try {
          L.geoJSON(wies.boundaryGeojson as GeoJSON.GeoJsonObject, {
            interactive: false,
            style: {
              color: "#1a4d28",
              weight: 2.5,
              fillColor: "#3d7a2e",
              fillOpacity: 0.07,
              dashArray: "8 6",
            },
          }).addTo(granica);
          const bounds = L.geoJSON(wies.boundaryGeojson as GeoJSON.GeoJsonObject).getBounds();
          if (bounds.isValid()) map.fitBounds(bounds.pad(0.08), { maxZoom: 16 });
          else map.setView([wies.lat, wies.lon], 14);
        } catch {
          map.setView([wies.lat, wies.lon], 14);
        }
      } else {
        map.setView([wies.lat, wies.lon], 14);
      }

      const warstwaPoi = L.layerGroup().addTo(map);
      refWarstwaPoi.current = warstwaPoi;

      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        if (refTryb.current !== "dodaj") return;
        ustawOczekujaca({ lat: e.latlng.lat, lng: e.latlng.lng });
        odswiezOczekujaca(e.latlng.lat, e.latlng.lng);
        ustawBlad("");
      });

      setTimeout(() => map.invalidateSize(), 100);
    })();

    return () => {
      cancelled = true;
      refWarstwaOczekujaca.current = null;
      refMarkery.current.clear();
      refMapa.current?.remove();
      refMapa.current = null;
      refL.current = null;
      refWarstwaPoi.current = null;
      refWarstwaGranica.current = null;
      refPodklad.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reinicjalizacja przy zmianie wsi
  }, [wies?.id]);

  useEffect(() => {
    const L = refL.current;
    const map = refMapa.current;
    const warstwy = refPodklad.current;
    if (!L || !map || !warstwy) return;
    ustawPodkladEdytoraMapy(L, map, warstwy, podklad);
  }, [podklad]);

  useEffect(() => {
    if (!oczekujaca) {
      refWarstwaOczekujaca.current?.remove();
      refWarstwaOczekujaca.current = null;
    }
  }, [oczekujaca, wiesId]);

  function zapiszNowaPinezke() {
    if (!wies || !oczekujaca) {
      ustawBlad("Kliknij mapę, aby wskazać miejsce pinezki.");
      return;
    }
    if (nazwa.trim().length < 2) {
      ustawBlad("Podaj nazwę (min. 2 znaki).");
      return;
    }
    ustawBlad("");
    startT(async () => {
      const w = await dodajPoiNaMapieSoltys({
        villageId: wies.id,
        category: kategoria,
        name: nazwa.trim(),
        description: opis.trim() || null,
        latitude: oczekujaca.lat,
        longitude: oczekujaca.lng,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawKomunikat(`Dodano pinezkę: ${nazwa.trim()}`);
      ustawOczekujaca(null);
      ustawNazwa("");
      ustawOpis("");
      router.refresh();
    });
  }

  function usunWybrany() {
    if (!wybranyId) return;
    const p = pois.find((x) => x.id === wybranyId);
    if (!p) return;
    if (!window.confirm(`Usunąć pinezkę „${p.name}” z mapy?`)) return;
    startT(async () => {
      const w = await usunPoiNaMapieSoltys({ poiId: wybranyId });
      if ("blad" in w) ustawBlad(w.blad);
      else {
        ustawWybranyId(null);
        ustawKomunikat("Usunięto pinezkę.");
        router.refresh();
      }
    });
  }

  function przyblizDoPoi(p: PoiNaMapieEdycja) {
    ustawWybranyId(p.id);
    refMapa.current?.flyTo([p.latitude, p.longitude], Math.max(refMapa.current.getZoom(), 16), { duration: 0.6 });
  }

  if (wsie.length === 0) {
    return <p className="text-sm text-stone-600">Brak przypisanej wsi w roli sołtysa.</p>;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,280px)_1fr]">
      <aside className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm lg:sticky lg:top-4 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto">
        {wsie.length > 1 ? (
          <label className="block text-sm">
            Wieś
            <select
              value={wiesId}
              onChange={(e) => {
                ustawWiesId(e.target.value);
                ustawOczekujaca(null);
                ustawWybranyId(null);
              }}
              className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-2"
            >
              {wsie.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="font-medium text-green-950">{wies?.name}</p>
        )}

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => ustawTryb("dodaj")}
            className={
              tryb === "dodaj"
                ? "rounded-lg bg-green-800 px-3 py-1.5 text-xs font-medium text-white"
                : "rounded-lg border border-stone-300 px-3 py-1.5 text-xs"
            }
          >
            + Dodaj pinezkę
          </button>
          <button
            type="button"
            onClick={() => {
              ustawTryb("przesuwaj");
              ustawOczekujaca(null);
            }}
            className={
              tryb === "przesuwaj"
                ? "rounded-lg bg-amber-800 px-3 py-1.5 text-xs font-medium text-white"
                : "rounded-lg border border-stone-300 px-3 py-1.5 text-xs"
            }
          >
            Przesuwaj
          </button>
        </div>

        {tryb === "dodaj" ? (
          <div className="space-y-3 rounded-xl border border-green-200/80 bg-green-50/40 p-3 text-sm">
            <p className="text-xs text-stone-700">
              <strong>Kliknij mapę</strong> (satelita lub plan) — bez wpisywania współrzędnych. Potem zapisz.
            </p>
            <label className="block">
              Kategoria
              <select
                value={kategoria}
                onChange={(e) => ustawKategoria(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5"
              >
                {KATEGORIE_DODAWANIA.map((k) => (
                  <option key={k} value={k}>
                    {etykietaKategoriiPoi(k) ?? k}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              Nazwa *
              <input
                value={nazwa}
                onChange={(e) => ustawNazwa(e.target.value)}
                placeholder={kategoria === "przystanek" ? "np. Przystanek — centrum" : "Nazwa miejsca"}
                maxLength={120}
                className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5"
              />
            </label>
            <label className="block">
              Opis (opcjonalnie)
              <textarea
                value={opis}
                onChange={(e) => ustawOpis(e.target.value)}
                rows={2}
                maxLength={800}
                className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5"
              />
            </label>
            {oczekujaca ? (
              <p className="text-xs text-stone-600">
                Punkt: {oczekujaca.lat.toFixed(5)}, {oczekujaca.lng.toFixed(5)} — przeciągnij żółty marker, jeśli trzeba
                poprawić.
              </p>
            ) : (
              <p className="text-xs text-amber-900">Wskaż miejsce kliknięciem na mapie po prawej.</p>
            )}
            <button
              type="button"
              disabled={czek || !oczekujaca}
              onClick={zapiszNowaPinezke}
              className="w-full rounded-lg bg-green-800 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {czek ? "Zapisuję…" : "Zapisz pinezkę"}
            </button>
          </div>
        ) : (
          <p className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-3 text-xs text-amber-950">
            Przeciągnij istniejącą pinezkę — pozycja zapisze się automatycznie. Przydatne przy korekcie importu z OSM.
          </p>
        )}

        {blad ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {blad}
          </p>
        ) : null}
        {komunikat ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
            {komunikat}
          </p>
        ) : null}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Pinezki ({pois.length})
          </p>
          <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
            {pois.length === 0 ? (
              <li className="text-xs text-stone-500">Brak punktów — dodaj pierwszy na mapie.</li>
            ) : (
              pois.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => przyblizDoPoi(p)}
                    className={`w-full rounded-lg px-2 py-1.5 text-left text-xs ${
                      wybranyId === p.id ? "bg-amber-100 ring-1 ring-amber-400" : "hover:bg-stone-50"
                    }`}
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="block text-stone-500">{etykietaKategoriiPoi(p.category)}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
          {wybranyId ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <Link
                href={`/mapa/miejsce/${wybranyId}`}
                className="text-xs font-medium text-green-800 underline"
                target="_blank"
              >
                Podgląd publiczny
              </Link>
              <button type="button" onClick={usunWybrany} className="text-xs text-red-700 underline">
                Usuń
              </button>
            </div>
          ) : null}
        </div>

        <p className="text-xs text-stone-500">
          Po dodaniu przystanku uzupełnij{" "}
          <Link href="/panel/soltys/moja-wies" className="text-green-800 underline">
            ręczny rozkład PKS
          </Link>{" "}
          w profilu wsi.
        </p>
      </aside>

      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => ustawPodklad("mapa")}
            className={
              podklad === "mapa"
                ? "rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-medium text-white"
                : "rounded-lg border border-stone-300 px-3 py-1.5 text-xs"
            }
          >
            Plan mapy
          </button>
          <button
            type="button"
            onClick={() => ustawPodklad("satelita")}
            className={
              podklad === "satelita"
                ? "rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-medium text-white"
                : "rounded-lg border border-stone-300 px-3 py-1.5 text-xs"
            }
          >
            Satelita (Esri)
          </button>
          <Link href="/mapa" target="_blank" className="ml-auto text-xs font-medium text-green-800 underline">
            Otwórz mapę publiczną ↗
          </Link>
        </div>
        <div
          ref={refEl}
          className="h-[min(72vh,640px)] w-full overflow-hidden rounded-2xl border-2 border-stone-200/90 shadow-inner ring-1 ring-stone-900/5"
          role="application"
          aria-label="Edytor mapy wsi — kliknij, aby dodać pinezkę"
        />
        <p className="text-xs text-stone-500">
          Zielony obrys = granica wsi (PRG). Kółko na mapie publicznej odświeży się w ciągu minuty.
        </p>
      </div>
    </div>
  );
}
