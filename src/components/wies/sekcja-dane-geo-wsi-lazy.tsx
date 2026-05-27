"use client";

import { useCallback, useState } from "react";
import type { DaneGeoWsi } from "@/lib/wies/pobierz-dane-geo-wsi";
import { KARTA_LISTY_WIES, OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";

function SekcjaGeoTresc({ dane }: { dane: DaneGeoWsi }) {
  const { geoKontekst, adresyUrzedowe, geoJakosc } = dane;
  const prng = geoKontekst
    .filter((x) => x.dataset === "PRNG")
    .filter((x) => x.feature_name || x.feature_category)
    .slice(0, 14);
  const instytucje = geoKontekst
    .filter((x) => x.dataset === "PRG_INSTITUTIONAL")
    .filter((x) => x.feature_name || x.feature_category)
    .slice(0, 14);
  const adresyWgUlicy = Array.from(
    adresyUrzedowe.reduce((acc, a) => {
      const k = a.street_name?.trim() || "(bez nazwy ulicy)";
      acc.set(k, (acc.get(k) ?? 0) + 1);
      return acc;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pl"))
    .slice(0, 20);
  const ostatniaAktualizacjaAdresow =
    adresyUrzedowe.length > 0
      ? adresyUrzedowe
          .map((a) => Date.parse(a.updated_at))
          .filter((t) => Number.isFinite(t))
          .sort((a, b) => b - a)[0]
      : null;

  const maDane =
    prng.length > 0 || instytucje.length > 0 || adresyUrzedowe.length > 0 || geoJakosc.maGraniceGeojson;

  if (!maDane) {
    return (
      <OslonaSekcjiWies id="sekcja-dane-geo" pusta>
        <TytulSekcjiWies
          etykieta="Geoportal"
          tytul="Dane referencyjne (Geoportal)"
          opis="Brak zsynchronizowanych danych geo dla tej wsi. Pojawią się po synchronizacji z rejestrami państwowymi."
        />
      </OslonaSekcjiWies>
    );
  }

  return (
    <OslonaSekcjiWies id="sekcja-dane-geo">
      <TytulSekcjiWies
        etykieta="Geoportal"
        tytul="Dane referencyjne (Geoportal)"
        opis="Nazwy geograficzne, obiekty instytucjonalne i punkty adresowe z rejestrów państwowych — pomocne przy orientacji i opisie okolicy."
      />

      <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <li className={KARTA_LISTY_WIES}>
          <p className="text-xs text-stone-500">Granica wsi</p>
          <p className="font-medium text-stone-900">{geoJakosc.maGraniceGeojson ? "OK" : "Brak"}</p>
        </li>
        <li className={KARTA_LISTY_WIES}>
          <p className="text-xs text-stone-500">Punkty adresowe</p>
          <p className="font-medium text-stone-900">{geoJakosc.liczbaAdresow}</p>
        </li>
        <li className={KARTA_LISTY_WIES}>
          <p className="text-xs text-stone-500">Obiekty PRNG</p>
          <p className="font-medium text-stone-900">{geoJakosc.liczbaPrng}</p>
        </li>
        <li className={KARTA_LISTY_WIES}>
          <p className="text-xs text-stone-500">Warstwy instytucjonalne</p>
          <p className="font-medium text-stone-900">{geoJakosc.liczbaInstytucji}</p>
        </li>
      </ul>

      <details className="mt-6 group rounded-xl border border-stone-200/90 bg-white/80 ring-1 ring-stone-900/[0.02]">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-green-950 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <span className="text-stone-400 transition group-open:rotate-90" aria-hidden>
              ▸
            </span>
            PRNG i instytucje ({prng.length + instytucje.length})
          </span>
        </summary>
        <div className="border-t border-stone-100 px-4 pb-4 pt-3">
          {prng.length === 0 && instytucje.length === 0 ? (
            <p className="text-sm text-stone-500">Brak obiektów w promieniu synchronizacji.</p>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">PRNG — nazwy geograficzne</h3>
                {prng.length === 0 ? (
                  <p className="mt-2 text-sm text-stone-500">Brak obiektów PRNG.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {prng.map((f) => (
                      <li key={f.id} className={KARTA_LISTY_WIES}>
                        <p className="font-medium text-stone-900">{f.feature_name ?? "Nazwa obiektu bez etykiety"}</p>
                        <p className="mt-1 text-xs text-stone-600">
                          {f.feature_category ?? "kategoria nieokreślona"}
                          {f.latitude != null && f.longitude != null ? (
                            <>
                              {" · "}
                              <a
                                href={`https://www.openstreetmap.org/?mlat=${f.latitude}&mlon=${f.longitude}&zoom=14`}
                                className="text-green-800 underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                punkt na mapie
                              </a>
                            </>
                          ) : null}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">PRG — warstwy instytucjonalne</h3>
                {instytucje.length === 0 ? (
                  <p className="mt-2 text-sm text-stone-500">Brak instytucji referencyjnych.</p>
                ) : (
                  <ul className="mt-2 space-y-2">
                    {instytucje.map((f) => (
                      <li key={f.id} className={KARTA_LISTY_WIES}>
                        <p className="font-medium text-stone-900">{f.feature_name ?? "Jednostka bez nazwy"}</p>
                        <p className="mt-1 text-xs text-stone-600">
                          {f.feature_category ?? f.layer_name}
                          {f.latitude != null && f.longitude != null ? (
                            <>
                              {" · "}
                              <a
                                href={`https://www.openstreetmap.org/?mlat=${f.latitude}&mlon=${f.longitude}&zoom=14`}
                                className="text-green-800 underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                punkt na mapie
                              </a>
                            </>
                          ) : null}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </details>

      <details className="mt-3 group rounded-xl border border-stone-200/90 bg-white/80 ring-1 ring-stone-900/[0.02]">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-green-950 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2">
            <span className="text-stone-400 transition group-open:rotate-90" aria-hidden>
              ▸
            </span>
            Ulice i punkty adresowe KIN/PRG ({adresyUrzedowe.length})
          </span>
        </summary>
        <div className="border-t border-stone-100 px-4 pb-4 pt-3">
          {adresyUrzedowe.length === 0 ? (
            <p className="text-sm text-stone-500">Brak punktów adresowych — synchronizacja uzupełni je automatycznie.</p>
          ) : (
            <>
              <p className="text-xs text-stone-600">
                Ulic z danymi: <strong>{adresyWgUlicy.length}</strong>
                {ostatniaAktualizacjaAdresow ? (
                  <>
                    {" · "}
                    Ostatnia aktualizacja:{" "}
                    <strong>{new Date(ostatniaAktualizacjaAdresow).toLocaleDateString("pl-PL")}</strong>
                  </>
                ) : null}
              </p>
              <div className="mt-3 grid gap-5 lg:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Najczęstsze ulice</h3>
                  <ul className="mt-2 space-y-2">
                    {adresyWgUlicy.map(([ulica, liczba]) => (
                      <li key={ulica} className={KARTA_LISTY_WIES}>
                        <p className="font-medium text-stone-900">{ulica}</p>
                        <p className="mt-1 text-xs text-stone-600">Punktów: {liczba}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Przykładowe adresy</h3>
                  <ul className="mt-2 space-y-2">
                    {adresyUrzedowe.slice(0, 20).map((a) => (
                      <li key={a.id} className={KARTA_LISTY_WIES}>
                        <p className="font-medium text-stone-900">
                          {a.street_name?.trim() ? `${a.street_name} ${a.house_number}` : a.house_number}
                        </p>
                        <p className="mt-1 text-xs text-stone-600">
                          {a.postal_code ?? "kod pocztowy b/d"}
                          {" · "}
                          <a
                            href={`https://www.openstreetmap.org/?mlat=${a.latitude}&mlon=${a.longitude}&zoom=17`}
                            className="text-green-800 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            punkt na mapie
                          </a>
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </details>
    </OslonaSekcjiWies>
  );
}

/** Dane geo ładowane dopiero po wejściu w widok (IntersectionObserver). */
export function SekcjaDaneGeoWsiLazy({ villageId }: { villageId: string }) {
  const [dane, setDane] = useState<DaneGeoWsi | null>(null);
  const [blad, setBlad] = useState("");
  const [laduje, setLaduje] = useState(false);

  const zaladuj = useCallback(async () => {
    if (dane || laduje) return;
    setLaduje(true);
    setBlad("");
    try {
      const res = await fetch(`/api/wies/${villageId}/geo`);
      if (!res.ok) throw new Error("Nie udało się pobrać danych geo.");
      setDane((await res.json()) as DaneGeoWsi);
    } catch {
      setBlad("Nie udało się załadować danych Geoportalu. Odśwież stronę.");
    } finally {
      setLaduje(false);
    }
  }, [dane, laduje, villageId]);

  if (blad) {
    return (
      <OslonaSekcjiWies id="sekcja-dane-geo" pusta>
        <p className="text-sm text-red-800">{blad}</p>
      </OslonaSekcjiWies>
    );
  }

  if (!dane) {
    return (
      <section id="sekcja-dane-geo" className="sekcja-poza-foldem mt-10 scroll-mt-8">
        <details
          className="rounded-2xl border border-stone-200/90 bg-stone-50/80 ring-1 ring-stone-900/[0.02]"
          onToggle={(e) => {
            if ((e.target as HTMLDetailsElement).open) void zaladuj();
          }}
        >
          <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-green-950">
            Dane referencyjne Geoportalu (PRNG, adresy KIN) — rozwiń, aby załadować
          </summary>
          <div className="border-t border-stone-200 px-5 py-4 text-sm text-stone-600">
            {laduje ? "Ładowanie danych geo…" : "Kliknij nagłówek powyżej — dane pobieramy dopiero na żądanie."}
          </div>
        </details>
      </section>
    );
  }

  return <SekcjaGeoTresc dane={dane} />;
}
