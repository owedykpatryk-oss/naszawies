"use client";

import "./mapa-panel-warstw.css";
import Link from "next/link";
import type { ReactNode } from "react";
import { ETYKIETA_LANDUSE, KOLOR_LANDUSE } from "@/lib/mapa/landuse-osm";
import type { ZnacznikPolowanie } from "./mapa-wsi-leaflet";

type SkrotPoi = {
  id: string;
  name: string;
  villageName: string;
  badge?: string;
  ikona: string;
  onClick: () => void;
};

type MapaSidebarSkrotyProps = {
  pokazZagospodarowanie: boolean;
  statusLanduse: string;
  bladLanduse: string;
  obrysyLanduseLen: number;
  filtrTransportPusty: boolean;
  trybLowiectwo: boolean;
  rewiryCount: number;
  liczbaInwestycji: number;
  liczbaLatarn: number;
  linkHubGminy: string | null;
  pokazLegendeSymboli: boolean;
  inwestycje: SkrotPoi[];
  ladneMiejsca: SkrotPoi[];
  kola: SkrotPoi[];
  polowania: ZnacznikPolowanie[];
  listaPolowan: ReactNode;
};

function SekcjaSkrotow({
  tytul,
  ikona,
  domyslnieOtwarta,
  children,
}: {
  tytul: string;
  ikona?: string;
  domyslnieOtwarta?: boolean;
  children: ReactNode;
}) {
  return (
    <details className="mapa-skroty-podsekcja" open={domyslnieOtwarta || undefined}>
      <summary className="mapa-skroty-podsekcja__naglowek">
        {ikona ? <span aria-hidden>{ikona}</span> : null}
        {tytul}
      </summary>
      <div className="mapa-skroty-podsekcja__tresc">{children}</div>
    </details>
  );
}

function ListaSkrotow({ elementy }: { elementy: SkrotPoi[] }) {
  if (elementy.length === 0) return null;
  return (
    <ul className="mapa-skroty-lista">
      {elementy.map((e) => (
        <li key={e.id}>
          <button type="button" className="mapa-skroty-lista__btn" onClick={e.onClick}>
            <span className="mapa-skroty-lista__tytul">
              <span aria-hidden>{e.ikona}</span> {e.name}
              {e.badge ? <span className="mapa-skroty-lista__badge">{e.badge}</span> : null}
            </span>
            <span className="mapa-skroty-lista__meta">{e.villageName}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function MapaSidebarSkroty({
  pokazZagospodarowanie,
  statusLanduse,
  bladLanduse,
  obrysyLanduseLen,
  filtrTransportPusty,
  trybLowiectwo,
  rewiryCount,
  liczbaInwestycji,
  liczbaLatarn,
  linkHubGminy,
  pokazLegendeSymboli,
  inwestycje,
  ladneMiejsca,
  kola,
  polowania,
  listaPolowan,
}: MapaSidebarSkrotyProps) {
  const maInwestycje = inwestycje.length > 0;
  const maLadne = ladneMiejsca.length > 0;
  const maKola = kola.length > 0;
  const maPolowania = polowania.length > 0;
  const maPodpowiedzi =
    pokazZagospodarowanie ||
    filtrTransportPusty ||
    trybLowiectwo ||
    liczbaInwestycji > 0 ||
    liczbaLatarn > 0 ||
    linkHubGminy ||
    pokazLegendeSymboli;

  const maSkroty = maInwestycje || maLadne || maKola || maPolowania;

  if (!maPodpowiedzi && !maSkroty) return null;

  return (
    <details className="mapa-skroty-glowne mt-4">
      <summary className="mapa-skroty-glowne__naglowek">
        <span>Skróty i podpowiedzi</span>
        <span className="mapa-skroty-glowne__licznik">
          {(maSkroty ? 1 : 0) + (maPodpowiedzi ? 1 : 0)}
        </span>
      </summary>
      <div className="mapa-skroty-glowne__tresc">
        {maSkroty ? (
          <SekcjaSkrotow tytul="Pokaż na mapie" ikona="📌" domyslnieOtwarta>
            {maPolowania ? listaPolowan : null}
            <ListaSkrotow elementy={inwestycje} />
            <ListaSkrotow elementy={ladneMiejsca} />
            <ListaSkrotow elementy={kola} />
          </SekcjaSkrotow>
        ) : null}

        {pokazLegendeSymboli ? (
          <SekcjaSkrotow tytul="Legenda symboli" ikona="🗺️">
            <ul className="mapa-legenda-inline">
              <li>
                <span className="mapa-legenda-inline__swatch mapa-legenda-inline__swatch--zgloszenia" /> Zgłoszenia
                (członek wsi)
              </li>
              <li>
                <span className="mapa-legenda-inline__swatch mapa-legenda-inline__swatch--polowanie" /> Polowanie —
                czerwony trwa, pomarańczowy plan
              </li>
              <li>
                <span className="mapa-legenda-inline__swatch mapa-legenda-inline__swatch--les" /> Ostrzeżenia leśne
              </li>
              <li>
                <span className="mapa-legenda-inline__ikona" aria-hidden>
                  🦌
                </span>{" "}
                Koła łowieckie
              </li>
            </ul>
          </SekcjaSkrotow>
        ) : null}

        {pokazZagospodarowanie ? (
          <SekcjaSkrotow tytul="Zagospodarowanie OSM" ikona="🌾">
            {statusLanduse === "wczytuje" ? (
              <p className="mapa-panel-hint mapa-panel-hint--stone">Wczytuję strefy z OpenStreetMap…</p>
            ) : statusLanduse === "blad" ? (
              <p className="mapa-panel-hint mapa-panel-hint--stone">{bladLanduse || "Brak danych."}</p>
            ) : (
              <p className="mapa-panel-hint mapa-panel-hint--stone">
                {obrysyLanduseLen > 0
                  ? `${obrysyLanduseLen} stref w okolicy — orientacyjnie, nie zastępuje MPZP.`
                  : "Brak polygonów landuse w tym obszarze."}
              </p>
            )}
            <ul className="mapa-legenda-inline mt-1">
              {(["forest", "farmland", "residential", "industrial", "meadow"] as const).map((k) => (
                <li key={k}>
                  <span
                    className="mapa-legenda-inline__swatch"
                    style={{
                      backgroundColor: KOLOR_LANDUSE[k]?.fill ?? "#94a3b8",
                      borderColor: KOLOR_LANDUSE[k]?.stroke ?? "#64748b",
                    }}
                  />
                  {ETYKIETA_LANDUSE[k]}
                </li>
              ))}
            </ul>
          </SekcjaSkrotow>
        ) : null}

        {filtrTransportPusty ? (
          <SekcjaSkrotow tytul="Transport" ikona="🚌">
            <p className="mapa-panel-hint mapa-panel-hint--stone">
              <strong className="text-sky-900">Brak przystanków w widoku.</strong> Rozkłady pojawią się po synchronizacji
              lub gdy sołtys doda przystanek w{" "}
              <Link href="/panel/soltys/moja-wies" className="font-semibold text-green-800 underline">
                Moja wieś → mapa POI
              </Link>
              .
            </p>
          </SekcjaSkrotow>
        ) : null}

        {trybLowiectwo ? (
          <SekcjaSkrotow tytul="Bezpieczeństwo w terenie" ikona="🦌">
            <p className="mapa-panel-hint mapa-panel-hint--stone">
              Ambony i posterunki to <strong>strefa ~500 m</strong> dla większości użytkowników. Członkowie wsi widzą
              dokładną pinezkę.
              {rewiryCount > 0 ? (
                <>
                  {" "}
                  Zielony polygon to rewir koła ({rewiryCount}).
                </>
              ) : null}
            </p>
          </SekcjaSkrotow>
        ) : null}

        {liczbaInwestycji > 0 ? (
          <SekcjaSkrotow tytul="O inwestycjach" ikona="🏗">
            <p className="mapa-panel-hint mapa-panel-hint--stone">
              Planowane budowy i roboty — pinezki z OSM lub dodane przez sołtysa.
            </p>
          </SekcjaSkrotow>
        ) : null}

        {liczbaLatarn > 0 ? (
          <SekcjaSkrotow tytul="O latarniach" ikona="💡">
            <p className="mapa-panel-hint mapa-panel-hint--stone">
              Z OSM lub od sołtysa. Uszkodzoną lampę zgłoś w{" "}
              <Link href="/panel/mieszkaniec/zgloszenia" className="font-semibold text-green-800 underline">
                Zgłoszeniach
              </Link>
              .
            </p>
          </SekcjaSkrotow>
        ) : null}

        {linkHubGminy ? (
          <Link href={linkHubGminy} className="mapa-link-gminy">
            Strona gminy — lista miejscowości →
          </Link>
        ) : null}
      </div>
    </details>
  );
}
