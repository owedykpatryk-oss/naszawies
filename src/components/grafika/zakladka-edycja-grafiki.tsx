"use client";

import { PresetyQrKlient } from "@/components/grafika/presety-qr-klient";
import { MOTYWY_GRAFIKI } from "@/lib/grafika/motywy";
import type { MotywGrafiki, ProfilWsiGrafiki, SzablonGrafiki } from "@/lib/grafika/typy";

type Props = {
  szablon: SzablonGrafiki;
  motyw: MotywGrafiki;
  motywId: string;
  wartosci: Record<string, string>;
  tytulProjektu: string;
  logoDataUrl: string | null;
  backgroundDataUrl: string | null;
  qrUrl: string;
  sciezkaWsi: string;
  profilWsi: ProfilWsiGrafiki | null;
  toDyplom: boolean;
  trybSoltys: boolean;
  villageId: string | null;
  oczekuje: boolean;
  maProfil: boolean;
  onPole: (id: string, v: string) => void;
  onTytulProjektu: (v: string) => void;
  onMotyw: (id: string) => void;
  onLogo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTlo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUsunLogo: () => void;
  onUsunTlo: () => void;
  onQr: (v: string) => void;
  onWstawProfil: () => void;
  onPodpisCyfrowy: () => void;
  onLogoZProfilu: () => void;
  onWstecz: () => void;
  onDalej: () => void;
};

export function ZakladkaEdycjaGrafiki({
  szablon,
  motyw,
  motywId,
  wartosci,
  tytulProjektu,
  logoDataUrl,
  backgroundDataUrl,
  qrUrl,
  sciezkaWsi,
  toDyplom,
  trybSoltys,
  villageId,
  oczekuje,
  maProfil,
  onPole,
  onTytulProjektu,
  onMotyw,
  onLogo,
  onTlo,
  onUsunLogo,
  onUsunTlo,
  onQr,
  onWstawProfil,
  onPodpisCyfrowy,
  onLogoZProfilu,
  onWstecz,
  onDalej,
}: Props) {
  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="font-serif text-lg text-green-950">Treść</h2>
        <p className="mt-1 text-sm text-stone-600">
          Szablon: <strong>{szablon.tytul}</strong> — podgląd po prawej odświeża się na bieżąco.
        </p>

        {maProfil ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onWstawProfil}
              className="rounded-lg border border-green-700 bg-green-50 px-3 py-2 text-sm text-green-900 hover:bg-green-100"
            >
              Wstaw dane z profilu wsi
            </button>
            {toDyplom ? (
              <button
                type="button"
                onClick={onPodpisCyfrowy}
                className="rounded-lg border border-amber-700 bg-amber-50 px-3 py-2 text-sm text-amber-950 hover:bg-amber-100"
              >
                Podpis elektroniczny sołtysa
              </button>
            ) : null}
          </div>
        ) : null}

        <label className="mt-4 block text-sm">
          <span className="font-medium text-stone-700">Nazwa pliku (opcjonalnie)</span>
          <input
            type="text"
            value={tytulProjektu}
            onChange={(e) => onTytulProjektu(e.target.value)}
            placeholder={szablon.tytul}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          />
        </label>

        <div className="mt-4 space-y-3">
          {szablon.pola.map((pole) => (
            <label key={pole.id} className="block text-sm">
              <span className="font-medium text-stone-700">{pole.etykieta}</span>
              {pole.typ === "textarea" ? (
                <textarea
                  rows={3}
                  value={wartosci[pole.id] ?? ""}
                  onChange={(e) => onPole(pole.id, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
                />
              ) : (
                <input
                  type={pole.typ === "date" ? "date" : pole.typ === "time" ? "time" : "text"}
                  value={wartosci[pole.id] ?? ""}
                  onChange={(e) => onPole(pole.id, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
                />
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="font-serif text-lg text-green-950">Wygląd</h2>
        <p className="mt-1 text-sm text-stone-600">Kolor i opcjonalnie logo, tło, kod QR.</p>

        <div className="mt-4">
          <span className="text-sm font-medium text-stone-700">Kolor</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {MOTYWY_GRAFIKI.map((m) => (
              <button
                key={m.id}
                type="button"
                title={m.nazwa}
                onClick={() => onMotyw(m.id)}
                className={`h-10 w-10 rounded-full border-2 ${
                  motywId === m.id ? "border-green-900 scale-110" : "border-white shadow"
                }`}
                style={{ backgroundColor: m.akcent }}
                aria-label={m.nazwa}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-stone-500">Wybrany: {motyw.nazwa}</p>
        </div>

        <details className="mt-5 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2" open>
          <summary className="cursor-pointer text-sm font-medium text-stone-800">Logo, tło, QR (opcjonalnie)</summary>
          <div className="mt-3 space-y-3 pb-2 text-sm">
            <label className="block">
              <span className="text-stone-700">Logo / herb (max 2 MB)</span>
              <input type="file" accept="image/*" onChange={onLogo} className="mt-1 block w-full text-xs" />
              {villageId && trybSoltys ? (
                <button
                  type="button"
                  onClick={onLogoZProfilu}
                  disabled={oczekuje}
                  className="mt-1 text-xs text-green-800 underline disabled:opacity-60"
                >
                  Wczytaj okładkę wsi jako logo
                </button>
              ) : null}
              {logoDataUrl ? (
                <button type="button" onClick={onUsunLogo} className="mt-1 text-xs text-red-700 underline">
                  Usuń logo
                </button>
              ) : null}
            </label>
            <label className="block">
              <span className="text-stone-700">Własne tło (zdjęcie)</span>
              <input type="file" accept="image/*" onChange={onTlo} className="mt-1 block w-full text-xs" />
              {backgroundDataUrl ? (
                <button type="button" onClick={onUsunTlo} className="mt-1 text-xs text-red-700 underline">
                  Usuń tło
                </button>
              ) : null}
            </label>
            <label className="block">
              <span className="text-stone-700">Link w kodzie QR</span>
              <input
                type="url"
                value={qrUrl}
                onChange={(e) => onQr(e.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5 text-xs"
              />
            </label>
            <PresetyQrKlient sciezkaWsi={sciezkaWsi} qrUrl={qrUrl} onUstawQr={onQr} />
          </div>
        </details>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={onWstecz} className="rounded-lg border border-stone-300 px-4 py-2 text-sm">
            ← Inny szablon
          </button>
          <button type="button" onClick={onDalej} className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white">
            Dalej — pobierz / opublikuj →
          </button>
        </div>
      </div>
    </section>
  );
}
