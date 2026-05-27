"use client";

import Link from "next/link";
import { useState } from "react";
import { KARTA_LISTY_WIES, OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";
import type { KontekstWsiTransport, LinkTransportuZewnetrzny } from "@/lib/transport/linki-zewnetrzne";
import { linkRozkladPrzystanku } from "@/lib/transport/linki-zewnetrzne";

export type TransportOdjazdPubliczny = {
  id: string;
  station_name: string | null;
  train_label: string;
  destination: string | null;
  platform: string | null;
  planned_at: string;
  realtime_at: string | null;
  delay_min: number | null;
  is_cancelled: boolean;
  status: string | null;
  fetched_at: string;
};

export type PrzystanekPubliczny = {
  id: string;
  name: string;
  latitude: number | string | null;
  longitude: number | string | null;
  description: string | null;
};

export type OdjazdAutobusuPubliczny = {
  id: string;
  stop_name: string | null;
  line_label: string;
  destination: string | null;
  planned_at: string;
  provider: string;
  fetched_at?: string;
};

export type TransportDaneWsi = {
  status: {
    status_color: string;
    status_label: string;
    delayed_count: number;
    cancelled_count: number;
    fallback_mode: boolean;
    updated_at: string;
  } | null;
  odjazdy: TransportOdjazdPubliczny[];
  odjazdyAutobus?: OdjazdAutobusuPubliczny[];
  odjazdyAutobusPoPrzystanku?: { przystanek: string; odjazdy: OdjazdAutobusuPubliczny[] }[];
  polaczeniaDoPowiatu?: TransportOdjazdPubliczny[];
  polaczeniaDoWojewodztwa?: TransportOdjazdPubliczny[];
  hubPowiatu?: { fraza: string; county: string | null; stacjaPkp?: string | null };
  hubWojewodztwa?: { fraza: string; voivodeship: string | null; stacjaPkp?: string | null };
  ostatniaAktualizacja?: { kolej: string | null; autobus: string | null };
  przystanki: PrzystanekPubliczny[];
  stacjeKolejowe: PrzystanekPubliczny[];
  stacjePkp: { station_name: string; distance_km: number | null }[];
  linkiZewnetrzne: LinkTransportuZewnetrzny[];
  wies: KontekstWsiTransport;
  maKolej: boolean;
  maAutobus: boolean;
  bladLadowania?: boolean;
};

function colorClass(status: string): string {
  if (status === "red") return "bg-rose-100 text-rose-900 border-rose-300";
  if (status === "orange") return "bg-amber-100 text-amber-900 border-amber-300";
  return "bg-emerald-100 text-emerald-900 border-emerald-300";
}

type Zakladka = "kolej" | "autobus";

export function WiesTransportWidget({
  status,
  odjazdy,
  odjazdyAutobus = [],
  odjazdyAutobusPoPrzystanku = [],
  polaczeniaDoPowiatu = [],
  polaczeniaDoWojewodztwa = [],
  hubPowiatu,
  ostatniaAktualizacja,
  przystanki,
  stacjeKolejowe,
  stacjePkp,
  linkiZewnetrzne,
  wies,
  maKolej,
  maAutobus,
  bladLadowania = false,
  delayAlertMin = 15,
  walkingMarginMin = 8,
}: TransportDaneWsi & {
  delayAlertMin?: number;
  walkingMarginMin?: number;
}) {
  const domyslnaZakladka: Zakladka = maKolej ? "kolej" : "autobus";
  const [zakladka, ustawZakladke] = useState<Zakladka>(domyslnaZakladka);

  const pokazSekcje = maKolej || maAutobus || linkiZewnetrzne.length > 0 || bladLadowania;
  if (!pokazSekcje) return null;

  const frazaStacji = encodeURIComponent(odjazdy[0]?.station_name ?? stacjePkp[0]?.station_name ?? stacjeKolejowe[0]?.name ?? "");
  const linkRozklad = frazaStacji ? `/transport/rozklad?stacja=${frazaStacji}` : "/transport";

  const teraz = Date.now();
  const najblizszy = odjazdy.find((o) => Date.parse(o.realtime_at ?? o.planned_at) > teraz);
  const minDoNajblizszego = najblizszy
    ? Math.max(0, Math.round((Date.parse(najblizszy.realtime_at ?? najblizszy.planned_at) - teraz) / 60000))
    : null;
  const wyjscieZa = minDoNajblizszego != null ? Math.max(0, minDoNajblizszego - walkingMarginMin) : null;

  const poranne = odjazdy
    .filter((o) => {
      const h = new Date(o.planned_at).getHours();
      return h >= 5 && h < 11;
    })
    .slice(0, 2);
  const wieczorne = odjazdy
    .filter((o) => {
      const h = new Date(o.planned_at).getHours();
      return h >= 16 && h <= 23;
    })
    .slice(-2);

  const linkiKolej = linkiZewnetrzne.filter((l) => l.rodzaj === "kolej" || l.rodzaj === "agregator");
  const linkiAutobus = linkiZewnetrzne.filter((l) => l.rodzaj === "autobus" || l.rodzaj === "agregator");

  return (
    <OslonaSekcjiWies id="sekcja-transport" className="from-sky-50/50 via-white to-[#f5f9f0]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <TytulSekcjiWies
          etykieta="Transport"
          tytul="Kolej, PKS i busy"
          opis="Pociągi z cache PKP oraz przystanki autobusowe z mapy wsi — linki do rozkładów PKS/PKP."
        />
        {status ? (
          <span className={`shrink-0 rounded-full border px-2 py-1 text-xs ${colorClass(status.status_color)}`}>
            Kolej: {status.status_label}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Rodzaj transportu">
        {maKolej ? (
          <button
            type="button"
            role="tab"
            aria-selected={zakladka === "kolej"}
            className={
              zakladka === "kolej"
                ? "rounded-xl bg-green-800 px-3 py-2 text-sm font-medium text-white"
                : "rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
            }
            onClick={() => ustawZakladke("kolej")}
          >
            Kolej (PKP)
          </button>
        ) : null}
        <button
          type="button"
          role="tab"
          aria-selected={zakladka === "autobus"}
          className={
            zakladka === "autobus"
              ? "rounded-xl bg-green-800 px-3 py-2 text-sm font-medium text-white"
              : "rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700"
          }
          onClick={() => ustawZakladke("autobus")}
        >
          Autobus / PKS{maAutobus ? ` (${przystanki.length})` : ""}
        </button>
      </div>

      {bladLadowania ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          Nie udało się pobrać danych transportu. Sprawdź linki poniżej lub{" "}
          <Link href="/transport" className="underline">
            centrum transportu
          </Link>
          .
        </p>
      ) : null}

      {zakladka === "kolej" && maKolej ? (
        <>
          {status?.fallback_mode ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Live chwilowo niedostępne — pokazujemy planowy rozkład z ostatniej synchronizacji.
            </p>
          ) : null}

          {!maKolej || odjazdy.length === 0 ? (
            <p className="mt-3 text-sm text-stone-600">
              Brak odjazdów w cache. Stacja może być w mapie — sprawdź{" "}
              <Link href={linkRozklad} className="text-green-800 underline">
                rozkład PKP
              </Link>
              . Dane live wymagają synchronizacji (PKP_PLK_API_KEY).
            </p>
          ) : (
            <>
              {wyjscieZa != null ? (
                <p className="mt-3 text-sm text-stone-700">
                  <strong>Czy zdążę?</strong> Wyjście za około <strong>{wyjscieZa} min</strong> (margines{" "}
                  {walkingMarginMin} min).
                </p>
              ) : null}

              <ul className="mt-4 space-y-2">
                {odjazdy.slice(0, 8).map((d) => {
                  const realtime = d.realtime_at ? new Date(d.realtime_at) : null;
                  const planned = new Date(d.planned_at);
                  const mocneOpoznienie = (d.delay_min ?? 0) >= delayAlertMin;
                  return (
                    <li key={d.id} className={KARTA_LISTY_WIES}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-stone-900">
                          {d.train_label}
                          {d.destination ? ` → ${d.destination}` : ""}
                        </p>
                        <p className="text-xs text-stone-500">{d.station_name ?? "Stacja"}</p>
                      </div>
                      <p className="mt-1 text-sm text-stone-700">
                        {planned.toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}
                        {realtime
                          ? ` → ${realtime.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}`
                          : ""}
                        {d.platform ? ` · peron ${d.platform}` : ""}
                      </p>
                      <p className="mt-1 text-xs">
                        {d.is_cancelled ? (
                          <span className="rounded bg-rose-100 px-2 py-0.5 text-rose-900">Odwołany</span>
                        ) : mocneOpoznienie ? (
                          <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-900">
                            Opóźnienie {d.delay_min} min
                          </span>
                        ) : d.delay_min != null && d.delay_min > 0 ? (
                          <span className="rounded bg-stone-100 px-2 py-0.5 text-stone-700">+{d.delay_min} min</span>
                        ) : (
                          <span className="rounded bg-emerald-100 px-2 py-0.5 text-emerald-800">Planowo</span>
                        )}
                      </p>
                    </li>
                  );
                })}
              </ul>

              {polaczeniaDoPowiatu.length > 0 ? (
                <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50/80 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-sky-900">
                    Do miasta powiatowego
                    {hubPowiatu?.stacjaPkp
                      ? ` → ${hubPowiatu.stacjaPkp}`
                      : hubPowiatu?.fraza
                        ? ` (${hubPowiatu.fraza})`
                        : ""}
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-stone-800">
                    {polaczeniaDoPowiatu.slice(0, 4).map((d) => (
                      <li key={`pow-${d.id}`}>
                        {new Date(d.planned_at).toLocaleString("pl-PL", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                        {" · "}
                        {d.train_label}
                        {d.destination ? ` → ${d.destination}` : ""}
                        {d.delay_min != null && d.delay_min > 0 ? ` (+${d.delay_min} min)` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : hubPowiatu?.fraza && odjazdy.length > 0 ? (
                <p className="mt-3 text-xs text-stone-600">
                  Brak bezpośrednich połączeń w cache do stacji „{hubPowiatu.fraza}” — sprawdź{" "}
                  <Link href={linkRozklad} className="text-green-800 underline">
                    rozkład PKP
                  </Link>
                  .
                </p>
              ) : null}

              {polaczeniaDoWojewodztwa.filter((d) => !polaczeniaDoPowiatu.some((p) => p.id === d.id)).length > 0 ? (
                <div className="mt-3 rounded-xl border border-stone-200 bg-white/80 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-600">Do województwa</p>
                  <ul className="mt-2 space-y-1 text-xs text-stone-700">
                    {polaczeniaDoWojewodztwa
                      .filter((d) => !polaczeniaDoPowiatu.some((p) => p.id === d.id))
                      .slice(0, 3)
                      .map((d) => (
                      <li key={`woj-${d.id}`}>
                        {new Date(d.planned_at).toLocaleTimeString("pl-PL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {` · ${d.train_label}`}
                        {d.destination ? ` → ${d.destination}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className={KARTA_LISTY_WIES}>
                  <p className="text-xs uppercase tracking-wide text-stone-500">Rano</p>
                  {poranne.length === 0 ? (
                    <p className="mt-1 text-xs text-stone-600">Brak kursów porannych.</p>
                  ) : (
                    <ul className="mt-1 space-y-1 text-xs text-stone-700">
                      {poranne.map((d) => (
                        <li key={`morning-${d.id}`}>
                          {new Date(d.planned_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                          {d.destination ? ` → ${d.destination}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className={KARTA_LISTY_WIES}>
                  <p className="text-xs uppercase tracking-wide text-stone-500">Wieczór</p>
                  {wieczorne.length === 0 ? (
                    <p className="mt-1 text-xs text-stone-600">Brak kursów wieczornych.</p>
                  ) : (
                    <ul className="mt-1 space-y-1 text-xs text-stone-700">
                      {wieczorne.map((d) => (
                        <li key={`evening-${d.id}`}>
                          {new Date(d.planned_at).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
                          {d.destination ? ` → ${d.destination}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}

          {stacjePkp.length > 0 ? (
            <p className="mt-3 text-xs text-stone-600">
              Stacje PKP w okolicy:{" "}
              {stacjePkp.map((s) => s.station_name).join(", ")}
            </p>
          ) : null}
        </>
      ) : null}

      {zakladka === "autobus" ? (
        <div className="mt-3">
          {odjazdyAutobusPoPrzystanku.length > 0 ? (
            <div className="mb-4 space-y-3">
              {odjazdyAutobusPoPrzystanku.map((grupa) => (
                <div key={grupa.przystanek} className={KARTA_LISTY_WIES}>
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{grupa.przystanek}</p>
                  <ul className="mt-2 space-y-1.5">
                    {grupa.odjazdy.map((b) => (
                      <li key={b.id} className="text-sm text-stone-800">
                        {new Date(b.planned_at).toLocaleTimeString("pl-PL", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {" · "}
                        {b.line_label}
                        {b.destination ? ` → ${b.destination}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : odjazdyAutobus.length > 0 ? (
            <ul className="mb-4 space-y-2">
              {odjazdyAutobus.slice(0, 10).map((b) => (
                <li key={b.id} className={KARTA_LISTY_WIES}>
                  <p className="font-medium text-stone-900">
                    {b.line_label}
                    {b.destination ? ` → ${b.destination}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-stone-700">
                    {new Date(b.planned_at).toLocaleString("pl-PL", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                    {b.stop_name ? ` · ${b.stop_name}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}

          {przystanki.length > 0 ? (
            <ul className="space-y-2">
              {przystanki.slice(0, 12).map((p) => (
                <li key={p.id} className={KARTA_LISTY_WIES}>
                  <p className="font-medium text-stone-900">{p.name}</p>
                  {p.description ? <p className="mt-1 text-xs text-stone-600">{p.description}</p> : null}
                  <p className="mt-2 text-xs">
                    <a
                      href={linkRozkladPrzystanku(p.name, wies)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-green-800 underline"
                    >
                      Szukaj kursu (e-podróżnik) ↗
                    </a>
                    {" · "}
                    <Link href="/mapa" className="text-green-800 underline">
                      Mapa wsi
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-stone-600">
              Brak przystanków na mapie wsi (import z OpenStreetMap). Użyj wyszukiwarek PKS poniżej — podaj miejscowość{" "}
              <strong>{wies.name}</strong>.
            </p>
          )}

          <ul className="mt-4 space-y-2">
            {linkiAutobus.map((l) => (
              <li key={l.id} className="rounded-lg border border-stone-200/90 bg-white/80 px-3 py-2 text-sm">
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="font-medium text-green-800 underline">
                  {l.etykieta} ↗
                </a>
                <span className="mt-0.5 block text-xs text-stone-600">{l.opis}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {ostatniaAktualizacja?.kolej || ostatniaAktualizacja?.autobus ? (
        <p className="mt-3 text-xs text-stone-500">
          Dane z cache
          {ostatniaAktualizacja.kolej
            ? ` · PKP: ${new Date(ostatniaAktualizacja.kolej).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}`
            : ""}
          {ostatniaAktualizacja.autobus
            ? ` · autobus: ${new Date(ostatniaAktualizacja.autobus).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}`
            : ""}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <Link href={linkRozklad} className="font-medium text-green-800 underline">
          Rozkład PKP (stacja)
        </Link>
        <Link href="/transport" className="font-medium text-green-800 underline">
          Centrum transportu
        </Link>
        <Link href="/panel/moje/transport" className="font-medium text-green-800 underline">
          Ustawienia transportu
        </Link>
      </div>

      {zakladka === "kolej" && linkiKolej.length > 0 ? (
        <div className="mt-3 border-t border-stone-200/80 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Inne źródła</p>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {linkiKolej.map((l) => (
              <li key={`k-${l.id}`}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-green-800 underline">
                  {l.etykieta} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </OslonaSekcjiWies>
  );
}
