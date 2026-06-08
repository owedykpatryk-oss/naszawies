"use client";

import "./mapa-panel-warstw.css";
import { useMemo, useState, type ReactNode } from "react";
import { KATEGORIA_LATARNIA } from "@/lib/mapa/kategorie-poi";
import { KATEGORIA_INWESTYCJA } from "@/lib/mapa/inwestycje-poi";
import { CZY_KIEG_WMS_DOSTEPNY, KIEG_WMS_MIN_ZOOM } from "@/lib/geoportal/kieg-wms";
import {
  czyPasujeDoPresetu,
  liczAktywneWarstwy,
  odczytajPoziomGranicyAdmin,
  type PresetWarstwMapy,
  type ZakladkaPaneluWarstwMobile,
  ustawGraniceAdmin,
  zapiszWidokMapy,
  wczytajWidokMapy,
  zastosujPresetWarstw,
  type StanWarstwDoZapisu,
  type UstawiaczeWarstw,
  type PoziomGranicyAdmin,
} from "@/lib/mapa/mapa-presety-warstw";
import type { FiltrAdministracyjny } from "@/components/mapa/mapa-filtr-administracyjny";

type WierszWarstwyProps = {
  wlaczone: boolean;
  onZmiana: (v: boolean) => void;
  etykieta: string;
  ikona?: string;
  title?: string;
  badge?: number;
  badgeVariant?: "czerwony" | "zielony";
};

function WierszWarstwy({
  wlaczone,
  onZmiana,
  etykieta,
  ikona,
  title,
  badge,
  badgeVariant = "czerwony",
}: WierszWarstwyProps) {
  return (
    <div
      className={`mapa-warstwa-wiersz ${wlaczone ? "mapa-warstwa-wiersz--aktywny" : ""}`}
      title={title}
    >
      <span className="mapa-warstwa-wiersz__lewa">
        {ikona ? <span className="mapa-warstwa-wiersz__ikona" aria-hidden>{ikona}</span> : null}
        <span className="mapa-warstwa-wiersz__etykieta">{etykieta}</span>
        {badge != null && badge > 0 ? (
          <span
            className={`mapa-warstwa-wiersz__badge ${badgeVariant === "zielony" ? "mapa-warstwa-wiersz__badge--zielony" : ""}`}
          >
            {badge}
          </span>
        ) : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={wlaczone}
        aria-label={etykieta}
        className={`mapa-przelacznik ${wlaczone ? "mapa-przelacznik--on" : ""}`}
        onClick={() => onZmiana(!wlaczone)}
      />
    </div>
  );
}

function SekcjaPanelu({
  tytul,
  domyslnieOtwarta = false,
  children,
}: {
  tytul: string;
  domyslnieOtwarta?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="mapa-sidebar-sekcja" open={domyslnieOtwarta || undefined}>
      <summary className="mapa-sidebar-sekcja__naglowek">{tytul}</summary>
      <div className="mapa-sidebar-sekcja__tresc">{children}</div>
    </details>
  );
}

export type MapaPanelWarstwProps = {
  filtrAdmin: FiltrAdministracyjny;
  zoomMapy: number;
  liczbaPolowanAktywnych: number;
  liczbaLesnychAktywnych: number;
  liczbaKol: number;
  liczbaAdresyKin: number;
  liczbaGeoKontekst: number;
  liczbaCmentarzy: number;
  liczbaInwestycji: number;
  liczbaLatarn: number;
  liczbaDroga: number;
  liczbaUslug: number;
  liczbaRatunekWoda: number;
  liczbaWodyOsp: number;
  filtrPoiEfektywny: string;
  kategoriePoi: string[];
  etykietaKategoriiPoi: (k: string) => string;
  kompletnoscSrednia?: { srednia: number; ponizej50: number };
  liczbaWsiFiltr: number;
  stan: StanWarstwDoZapisu & {
    tylkoAktywnePolowania: boolean;
    pokazZakonczoneInwestycje: boolean;
  };
  ustaw: UstawiaczeWarstw & {
    ustawTylkoAktywnePolowania: (v: boolean | ((p: boolean) => boolean)) => void;
    ustawPokazZakonczoneInwestycje: (v: boolean | ((p: boolean) => boolean)) => void;
  };
  onPreset: (preset: PresetWarstwMapy) => void;
  onWlasny: () => void;
  onWidokWOkolicy?: () => void;
  maGps: boolean;
};

const PRESETY: { id: Exclude<PresetWarstwMapy, "wlasny">; label: string; ikona: string }[] = [
  { id: "wies", label: "Wieś", ikona: "🏡" },
  { id: "dzialka", label: "Działka", ikona: "📐" },
  { id: "lowiectwo", label: "Łowiectwo", ikona: "🦌" },
  { id: "transport", label: "Transport", ikona: "🚌" },
  { id: "czysta", label: "Czysta", ikona: "🗺️" },
];

const ZAKLADKI_MOBILE: { id: ZakladkaPaneluWarstwMobile; label: string }[] = [
  { id: "widok", label: "Widok" },
  { id: "granice", label: "Granice" },
  { id: "poi", label: "POI" },
  { id: "wiecej", label: "Więcej" },
];

function SekcjaMobilna({
  zakladka,
  aktywna,
  children,
}: {
  zakladka: ZakladkaPaneluWarstwMobile;
  aktywna: ZakladkaPaneluWarstwMobile;
  children: ReactNode;
}) {
  const ukryjNaMobile = aktywna !== zakladka;
  return <div className={ukryjNaMobile ? "hidden lg:block" : undefined}>{children}</div>;
}

export function MapaPanelWarstw({
  filtrAdmin,
  zoomMapy,
  liczbaPolowanAktywnych,
  liczbaLesnychAktywnych,
  liczbaKol,
  liczbaAdresyKin,
  liczbaGeoKontekst,
  liczbaCmentarzy,
  liczbaInwestycji,
  liczbaLatarn,
  liczbaDroga,
  liczbaUslug,
  liczbaRatunekWoda,
  liczbaWodyOsp,
  filtrPoiEfektywny,
  kategoriePoi,
  etykietaKategoriiPoi,
  kompletnoscSrednia,
  liczbaWsiFiltr,
  stan,
  ustaw,
  onPreset,
  onWlasny,
  onWidokWOkolicy,
  maGps,
}: MapaPanelWarstwProps) {
  const [zakladkaMobile, ustawZakladkeMobile] = useState<ZakladkaPaneluWarstwMobile>("widok");
  const [komunikatZapisu, ustawKomunikatZapisu] = useState<"" | "ok" | "brak">("");

  const liczbaWarstw = useMemo(() => liczAktywneWarstwy(stan), [stan]);

  const presetAktywny = useMemo((): PresetWarstwMapy => {
    for (const p of PRESETY) {
      if (czyPasujeDoPresetu(p.id, stan)) return p.id;
    }
    return "wlasny";
  }, [stan]);

  const graniceAdmin = odczytajPoziomGranicyAdmin(stan);

  const pokazHintEgib =
    CZY_KIEG_WMS_DOSTEPNY &&
    (stan.pokazGraniceDzialek || stan.pokazGraniceObrebow) &&
    zoomMapy < KIEG_WMS_MIN_ZOOM;

  const ustawGraniceAdminPanel = (wlaczone: boolean, poziom: PoziomGranicyAdmin) => {
    onWlasny();
    ustawGraniceAdmin(ustaw, wlaczone, poziom);
  };

  const zapiszWidok = () => {
    zapiszWidokMapy(stan);
    ustawKomunikatZapisu("ok");
    window.setTimeout(() => ustawKomunikatZapisu(""), 2000);
  };

  const przywrocWidok = () => {
    const z = wczytajWidokMapy();
    if (!z) {
      ustawKomunikatZapisu("brak");
      window.setTimeout(() => ustawKomunikatZapisu(""), 2000);
      return;
    }
    onWlasny();
    ustaw.ustawTrybLowiectwo(z.trybLowiectwo);
    ustaw.ustawPokazPolowania(z.pokazPolowania);
    ustaw.ustawPokazOstrzezeniaLesne(z.pokazOstrzezeniaLesne);
    ustaw.ustawPokazKola(z.pokazKola);
    ustaw.ustawPokazZgloszenia(z.pokazZgloszenia);
    ustaw.ustawPokazRynekMapa(z.pokazRynekMapa);
    ustaw.ustawPokazRynekDzialki(z.pokazRynekDzialki);
    ustaw.ustawPokazGraniceWsi(z.pokazGraniceWsi);
    ustaw.ustawPokazGraniceDzialek(z.pokazGraniceDzialek);
    ustaw.ustawPokazGraniceObrebow(z.pokazGraniceObrebow);
    ustaw.ustawPokazObrysGminy(z.pokazObrysGminy);
    ustaw.ustawPokazObrysPowiatu(z.pokazObrysPowiatu);
    ustaw.ustawPokazObrysWojewodztwa(z.pokazObrysWojewodztwa);
    ustaw.ustawPokazNadlesnictwa(z.pokazNadlesnictwa);
    ustaw.ustawPokazLesnictwa(z.pokazLesnictwa);
    ustaw.ustawPokazObwodyLowieckie(z.pokazObwodyLowieckie);
    ustaw.ustawPokazZagospodarowanie(z.pokazZagospodarowanie);
    ustaw.ustawPokazAdresyKin(z.pokazAdresyKin);
    ustaw.ustawPokazGeoKontekst(z.pokazGeoKontekst);
    ustaw.ustawPokazPoiWarstwa(z.pokazPoiWarstwa);
    ustaw.ustawPokazCmentarze(z.pokazCmentarze);
    ustaw.ustawPokazOswietlenie(z.pokazOswietlenie);
    ustaw.setFiltrPoi(z.filtrPoi);
    ustaw.ustawTylkoObrysPrg(z.tylkoObrysPrg);
    ustaw.ustawTylkoOferty(z.tylkoOferty);
    ustaw.ustawPromienKm(z.promienKm);
    ustawKomunikatZapisu("ok");
    window.setTimeout(() => ustawKomunikatZapisu(""), 2000);
  };

  const chipyPoi = (
    [
      { id: "wszystkie", label: "Wszystkie" },
      { id: "transport", label: "🚌 Transport" },
      ...(liczbaDroga > 0 ? [{ id: "droga", label: `🛣 Droga (${liczbaDroga})` } as const] : []),
      ...(liczbaUslug > 0 ? [{ id: "uslugi", label: `🏪 Usługi (${liczbaUslug})` } as const] : []),
      ...(liczbaRatunekWoda > 0
        ? [{ id: "woda_osp", label: `💧 Ratunek (${liczbaRatunekWoda})` } as const]
        : liczbaWodyOsp > 0
          ? [{ id: "woda_osp", label: `💧 OSP (${liczbaWodyOsp})` } as const]
          : []),
      { id: "sklep", label: "🛒 Sklepy" },
      { id: "apteka", label: "💊 Apteki" },
      { id: "szkola", label: "🏫 Szkoły" },
      { id: "przystanek", label: "🚏 Przystanki" },
      { id: "cmentarz", label: "🕯 Cmentarze" },
      ...(liczbaInwestycji > 0
        ? [{ id: KATEGORIA_INWESTYCJA, label: `🏗 Inwest. (${liczbaInwestycji})` } as const]
        : []),
      ...(liczbaLatarn > 0
        ? [{ id: KATEGORIA_LATARNIA, label: `💡 Światło (${liczbaLatarn})` } as const]
        : []),
    ] as const
  );

  return (
    <div className="mapa-panel-warstw">
      <div className="mapa-panel-warstw__naglowek">
        <p className="mapa-panel-warstw__tytul">
          <span className="mapa-panel-warstw__ikona-tytul" aria-hidden>
            🗺
          </span>
          Warstwy
          <span className="mapa-panel-warstw__licznik" aria-label={`${liczbaWarstw} aktywnych warstw`}>
            {liczbaWarstw}
          </span>
        </p>
        <div className="mapa-panel-warstw__akcje">
          <button type="button" className="mapa-panel-warstw__btn-tekstowy" onClick={zapiszWidok} title="Zapisz widok">
            Zapisz
          </button>
          <button type="button" className="mapa-panel-warstw__btn-tekstowy" onClick={przywrocWidok} title="Przywróć widok">
            Przywróć
          </button>
        </div>
      </div>

      {komunikatZapisu === "ok" ? (
        <p className="mapa-panel-warstw__toast mapa-panel-warstw__toast--ok">Widok zapisany w tej sesji.</p>
      ) : komunikatZapisu === "brak" ? (
        <p className="mapa-panel-warstw__toast mapa-panel-warstw__toast--blad">Brak zapisanego widoku.</p>
      ) : null}

      <div className="mapa-panel-warstw__zakladki" role="tablist" aria-label="Sekcje warstw">
        {ZAKLADKI_MOBILE.map((z) => (
          <button
            key={z.id}
            type="button"
            role="tab"
            aria-selected={zakladkaMobile === z.id}
            className={`mapa-panel-warstw__zakladka ${zakladkaMobile === z.id ? "mapa-panel-warstw__zakladka--aktywna" : ""}`}
            onClick={() => ustawZakladkeMobile(z.id)}
          >
            {z.label}
          </button>
        ))}
      </div>

      <SekcjaMobilna zakladka="widok" aktywna={zakladkaMobile}>
        <SekcjaPanelu tytul="Szybki widok" domyslnieOtwarta>
          <div className="mapa-preset-siatka" role="group" aria-label="Presety widoku mapy">
            {PRESETY.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`mapa-preset-karta ${presetAktywny === p.id ? "mapa-preset-karta--aktywna" : ""}`}
                onClick={() => {
                  zastosujPresetWarstw(p.id, ustaw);
                  onPreset(p.id);
                }}
              >
                <span className="mapa-preset-karta__ikona" aria-hidden>
                  {p.ikona}
                </span>
                {p.label}
              </button>
            ))}
            <button
              type="button"
              className={`mapa-preset-karta mapa-preset-karta--dostosuj ${presetAktywny === "wlasny" ? "mapa-preset-karta--aktywna" : ""}`}
              onClick={onWlasny}
            >
              <span className="mapa-preset-karta__ikona" aria-hidden>
                ⚙️
              </span>
              Dostosuj warstwy
            </button>
          </div>
          {onWidokWOkolicy && maGps ? (
            <button type="button" className="mapa-panel-cta" onClick={onWidokWOkolicy}>
              <span aria-hidden>📍</span>
              Warstwy w okolicy (25 km)
            </button>
          ) : null}
        </SekcjaPanelu>

        <SekcjaPanelu tytul="Które wsie pokazać" domyslnieOtwarta>
          <div className="mapa-warstwa-lista" role="group" aria-label="Filtry listy wsi">
            <WierszWarstwy
              wlaczone={stan.tylkoObrysPrg}
              onZmiana={(v) => {
                onWlasny();
                ustaw.ustawTylkoObrysPrg(v);
              }}
              etykieta="Tylko z obrysem PRG"
              ikona="🗺️"
            />
            <WierszWarstwy
              wlaczone={stan.tylkoOferty}
              onZmiana={(v) => {
                onWlasny();
                ustaw.ustawTylkoOferty(v);
              }}
              etykieta="Tylko z ofertami targu"
              ikona="🛒"
            />
          </div>
          <p className="mapa-panel-hint mapa-panel-hint--stone">
            Filtrują listę wsi w panelu — nie ukrywają warstw na mapie.
          </p>
        </SekcjaPanelu>
      </SekcjaMobilna>

      <SekcjaMobilna zakladka="granice" aktywna={zakladkaMobile}>
        <SekcjaPanelu tytul="Granice i grunt" domyslnieOtwarta>
          <div className="mapa-admin-karta">
            <WierszWarstwy
              wlaczone={graniceAdmin.wlaczone}
              onZmiana={(v) => ustawGraniceAdminPanel(v, graniceAdmin.poziom)}
              etykieta="Granice administracyjne"
              ikona="🏛️"
            />
            {graniceAdmin.wlaczone ? (
              <select
                value={graniceAdmin.poziom}
                onChange={(e) => ustawGraniceAdminPanel(true, e.target.value as PoziomGranicyAdmin)}
                className="mapa-select-panel"
                aria-label="Poziom granicy administracyjnej"
              >
                <option value="wsi">Obrysy wsi (PRG)</option>
                <option value="gmina">Granica gminy</option>
                <option value="powiat">Granica powiatu</option>
                <option value="woj">Granica województwa</option>
              </select>
            ) : null}
          </div>
          {CZY_KIEG_WMS_DOSTEPNY ? (
            <div className="mapa-warstwa-lista mt-2">
              <WierszWarstwy
                wlaczone={stan.pokazGraniceDzialek}
                onZmiana={(v) => {
                  onWlasny();
                  ustaw.ustawPokazGraniceDzialek(v);
                }}
                etykieta="Granice działek (EGiB)"
                ikona="📐"
                title={`Widoczne od zoomu ${KIEG_WMS_MIN_ZOOM}`}
              />
              <WierszWarstwy
                wlaczone={stan.pokazGraniceObrebow}
                onZmiana={(v) => {
                  onWlasny();
                  ustaw.ustawPokazGraniceObrebow(v);
                }}
                etykieta="Obręby ewidencyjne"
                ikona="🗂️"
                title={`Widoczne od zoomu ${KIEG_WMS_MIN_ZOOM}`}
              />
            </div>
          ) : null}
          {pokazHintEgib ? (
            <p className="mapa-panel-hint mapa-panel-hint--fuchsia">
              Przybliż mapę do zoomu <strong>{KIEG_WMS_MIN_ZOOM}+</strong> (teraz {zoomMapy}), aby zobaczyć granice
              EGiB.
            </p>
          ) : null}
          <div className="mapa-warstwa-lista mt-1">
            <WierszWarstwy
              wlaczone={stan.pokazZagospodarowanie}
              onZmiana={(v) => {
                onWlasny();
                ustaw.ustawPokazZagospodarowanie(v);
              }}
              etykieta="Zagospodarowanie (OSM)"
              ikona="🌾"
            />
          </div>
        </SekcjaPanelu>
      </SekcjaMobilna>

      <SekcjaMobilna zakladka="poi" aktywna={zakladkaMobile}>
        <SekcjaPanelu tytul="Społeczność" domyslnieOtwarta>
          <div className="mapa-warstwa-lista" role="group" aria-label="Warstwy społeczności">
            <WierszWarstwy
              wlaczone={stan.pokazPoiWarstwa}
              onZmiana={(v) => {
                onWlasny();
                ustaw.ustawPokazPoiWarstwa(v);
              }}
              etykieta="Miejsca POI"
              ikona="📍"
            />
            <WierszWarstwy
              wlaczone={stan.pokazRynekMapa}
              onZmiana={(v) => {
                onWlasny();
                ustaw.ustawPokazRynekMapa(v);
              }}
              etykieta="Rynek"
              ikona="🏷️"
            />
            {stan.pokazRynekMapa ? (
              <WierszWarstwy
                wlaczone={stan.pokazRynekDzialki}
                onZmiana={(v) => {
                  onWlasny();
                  ustaw.ustawPokazRynekDzialki(v);
                }}
                etykieta="Działki z rynku"
                ikona="📋"
              />
            ) : null}
            <WierszWarstwy
              wlaczone={stan.pokazZgloszenia}
              onZmiana={(v) => {
                onWlasny();
                ustaw.ustawPokazZgloszenia(v);
              }}
              etykieta="Zgłoszenia mieszkańców"
              ikona="📢"
            />
            {liczbaCmentarzy > 0 ? (
              <WierszWarstwy
                wlaczone={stan.pokazCmentarze}
                onZmiana={(v) => {
                  onWlasny();
                  ustaw.ustawPokazCmentarze(v);
                }}
                etykieta={`Cmentarze (${liczbaCmentarzy})`}
                ikona="🕯"
              />
            ) : null}
          </div>
        </SekcjaPanelu>

        <SekcjaPanelu tytul="Filtry POI">
          <div className="mapa-poi-chipy" role="group" aria-label="Szybki filtr kategorii POI">
            {chipyPoi.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onWlasny();
                  ustaw.setFiltrPoi(id);
                }}
                className={`mapa-poi-chip ${filtrPoiEfektywny === id ? "mapa-poi-chip--aktywny" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>
          {liczbaLatarn > 0 && filtrPoiEfektywny === "wszystkie" ? (
            <div className="mapa-warstwa-lista mt-2">
              <WierszWarstwy
                wlaczone={stan.pokazOswietlenie}
                onZmiana={(v) => {
                  onWlasny();
                  ustaw.ustawPokazOswietlenie(v);
                }}
                etykieta="Latarnie na mapie"
                ikona="💡"
              />
            </div>
          ) : null}
          {liczbaInwestycji > 0 ? (
            <div className="mapa-warstwa-lista mt-1">
              <WierszWarstwy
                wlaczone={stan.pokazZakonczoneInwestycje}
                onZmiana={(v) => {
                  onWlasny();
                  ustaw.ustawPokazZakonczoneInwestycje(v);
                }}
                etykieta="Zakończone inwestycje"
                ikona="🏗"
              />
            </div>
          ) : null}
          <label htmlFor="mapa-filtr-poi-select" className="sr-only">
            Filtr kategorii punktów POI
          </label>
          <select
            id="mapa-filtr-poi-select"
            value={filtrPoiEfektywny}
            onChange={(e) => {
              onWlasny();
              ustaw.setFiltrPoi(e.target.value);
            }}
            className="mapa-select-panel mt-2"
          >
            <option value="wszystkie">Wszystkie punkty POI</option>
            <option value="transport">🚌🚆 Transport (PKS + PKP)</option>
            {kategoriePoi.map((k) => (
              <option key={k} value={k}>
                {etykietaKategoriiPoi(k)}
              </option>
            ))}
          </select>
        </SekcjaPanelu>
      </SekcjaMobilna>

      <SekcjaMobilna zakladka="wiecej" aktywna={zakladkaMobile}>
        <SekcjaPanelu tytul="Przyroda i łowiectwo" domyslnieOtwarta>
          <div className="mapa-warstwa-lista" role="group" aria-label="Warstwy łowieckie">
            <WierszWarstwy
              wlaczone={stan.trybLowiectwo}
              onZmiana={(v) => {
                onWlasny();
                ustaw.ustawTrybLowiectwo(v);
                if (v) {
                  ustaw.ustawPokazPolowania(true);
                  ustaw.ustawPokazKola(true);
                  ustaw.ustawPokazZgloszenia(false);
                  ustaw.ustawPokazRynekMapa(false);
                }
              }}
              etykieta="Tryb łowiectwo"
              ikona="🦌"
              badge={liczbaPolowanAktywnych}
            />
            <WierszWarstwy
              wlaczone={stan.pokazPolowania}
              onZmiana={(v) => {
                onWlasny();
                ustaw.ustawPokazPolowania(v);
              }}
              etykieta="Polowania"
              ikona="🎯"
            />
            {(stan.trybLowiectwo || stan.pokazPolowania) && (
              <WierszWarstwy
                wlaczone={stan.tylkoAktywnePolowania}
                onZmiana={() => {
                  onWlasny();
                  ustaw.ustawTylkoAktywnePolowania((p) => !p);
                }}
                etykieta="Tylko trwające polowania"
                ikona="⏱"
              />
            )}
            <WierszWarstwy
              wlaczone={stan.pokazOstrzezeniaLesne}
              onZmiana={(v) => {
                onWlasny();
                ustaw.ustawPokazOstrzezeniaLesne(v);
              }}
              etykieta="Ostrzeżenia leśne"
              ikona="🌲"
              badge={liczbaLesnychAktywnych}
              badgeVariant="zielony"
            />
            <WierszWarstwy
              wlaczone={stan.pokazKola}
              onZmiana={(v) => {
                onWlasny();
                ustaw.ustawPokazKola(v);
              }}
              etykieta={`Koła łowieckie (${liczbaKol})`}
              ikona="🏕"
            />
            <WierszWarstwy
              wlaczone={stan.pokazObwodyLowieckie}
              onZmiana={(v) => {
                onWlasny();
                ustaw.ustawPokazObwodyLowieckie(v);
              }}
              etykieta="Obwody łowieckie"
              ikona="🦌"
            />
            <WierszWarstwy
              wlaczone={stan.pokazLesnictwa}
              onZmiana={(v) => {
                onWlasny();
                ustaw.ustawPokazLesnictwa(v);
              }}
              etykieta="Leśnictwa (BDL)"
              ikona="🌿"
            />
            <WierszWarstwy
              wlaczone={stan.pokazNadlesnictwa}
              onZmiana={(v) => {
                onWlasny();
                ustaw.ustawPokazNadlesnictwa(v);
              }}
              etykieta="Nadleśnictwa (LP)"
              ikona="🌲"
            />
          </div>
        </SekcjaPanelu>

        <SekcjaPanelu tytul="Zaawansowane">
          <div className="mapa-warstwa-lista" role="group" aria-label="Warstwy zaawansowane">
            {liczbaAdresyKin > 0 ? (
              <WierszWarstwy
                wlaczone={stan.pokazAdresyKin}
                onZmiana={(v) => {
                  onWlasny();
                  ustaw.ustawPokazAdresyKin(v);
                }}
                etykieta={`Adresy KIN (${liczbaAdresyKin})`}
                ikona="📍"
              />
            ) : null}
            {liczbaGeoKontekst > 0 ? (
              <WierszWarstwy
                wlaczone={stan.pokazGeoKontekst}
                onZmiana={(v) => {
                  onWlasny();
                  ustaw.ustawPokazGeoKontekst(v);
                }}
                etykieta={`Kontekst PRNG (${liczbaGeoKontekst})`}
                ikona="🏛️"
              />
            ) : null}
          </div>
          {(filtrAdmin.wojSlug || filtrAdmin.powSlug || filtrAdmin.gminaSlug) && (
            <p className="mapa-panel-hint mapa-panel-hint--stone">
              Filtr administracyjny:{" "}
              {[filtrAdmin.gminaSlug, filtrAdmin.powSlug, filtrAdmin.wojSlug].filter(Boolean).join(" · ")}
            </p>
          )}
        </SekcjaPanelu>
      </SekcjaMobilna>

      {kompletnoscSrednia && liczbaWsiFiltr > 0 && liczbaWsiFiltr <= 200 ? (
        <div className="mapa-kompletnosc-karta">
          <strong>Kompletność mapy</strong> — średnia {liczbaWsiFiltr} {liczbaWsiFiltr === 1 ? "wsi" : "wsi"}:{" "}
          <span className="mapa-kompletnosc-karta__wartosc">{kompletnoscSrednia.srednia}%</span>
          {kompletnoscSrednia.ponizej50 > 0 ? (
            <> · {kompletnoscSrednia.ponizej50} poniżej 50%</>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
