"use client";

import { DOMYSLNY_BACKGROUND_OVERLAY, overlayNaWidocznoscTla, widocznoscTlaNaOverlay } from "@/lib/grafika/meta-tla-grafiki";

type Props = {
  backgroundDataUrl: string | null;
  backgroundOverlay: number;
  villageId: string | null;
  trybSoltys: boolean;
  maOkladkeWsi: boolean;
  oczekuje: boolean;
  onTlo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUsunTlo: () => void;
  onTloZProfilu: () => void;
  onOverlay: (v: number) => void;
};

export function SekcjaTlaGrafiki({
  backgroundDataUrl,
  backgroundOverlay,
  villageId,
  trybSoltys,
  maOkladkeWsi,
  oczekuje,
  onTlo,
  onUsunTlo,
  onTloZProfilu,
  onOverlay,
}: Props) {
  const widocznosc = overlayNaWidocznoscTla(backgroundOverlay);

  return (
    <div className="rounded-xl border border-violet-200/90 bg-gradient-to-br from-violet-50/60 to-white p-4">
      <h3 className="text-sm font-semibold text-violet-950">Własne tło zdjęciem</h3>
      <p className="mt-1 text-xs text-stone-600">
        Wgraj zdjęcie wsi, sali lub pleneru — reguluj widoczność, żeby tekst pozostał czytelny.
      </p>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className="relative h-28 w-full shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100 sm:w-36"
          aria-hidden={!backgroundDataUrl}
        >
          {backgroundDataUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={backgroundDataUrl} alt="" className="h-full w-full object-cover" />
              <div
                className="absolute inset-0 bg-white"
                style={{ opacity: backgroundOverlay }}
              />
              <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                Podgląd overlay
              </span>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-[11px] text-stone-400">Brak tła</div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <label className="block">
            <span className="text-xs font-medium text-stone-700">Wgraj zdjęcie (max 2 MB)</span>
            <input type="file" accept="image/*" onChange={onTlo} className="mt-1 block w-full text-xs" />
          </label>

          {villageId && trybSoltys && maOkladkeWsi ? (
            <button
              type="button"
              onClick={onTloZProfilu}
              disabled={oczekuje}
              className="rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-xs font-medium text-violet-900 hover:bg-violet-50 disabled:opacity-60"
            >
              Użyj okładki wsi jako tła
            </button>
          ) : null}

          {backgroundDataUrl ? (
            <>
              <label className="block text-xs">
                <span className="font-medium text-stone-700">
                  Widoczność zdjęcia: <strong>{widocznosc}%</strong>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={widocznosc}
                  onChange={(e) => onOverlay(widocznoscTlaNaOverlay(Number(e.target.value)))}
                  className="mt-1 w-full accent-violet-700"
                />
                <span className="text-[10px] text-stone-500">
                  Niżej = jaśniejsze tło i czytelniejszy tekst · Wyżej = mocniejsze zdjęcie
                </span>
              </label>
              <button type="button" onClick={onUsunTlo} className="text-xs text-red-700 underline">
                Usuń własne tło
              </button>
            </>
          ) : (
            <p className="text-[11px] text-stone-500">
              Bez zdjęcia używany jest kolor motywu. Overlay domyślny:{" "}
              {Math.round((1 - DOMYSLNY_BACKGROUND_OVERLAY) * 100)}% widoczności.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
