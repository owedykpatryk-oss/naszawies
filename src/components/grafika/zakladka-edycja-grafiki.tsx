"use client";

import { PresetyQrKlient } from "@/components/grafika/presety-qr-klient";
import { SekcjaTlaGrafiki } from "@/components/grafika/sekcja-tla-grafiki";
import { BannerPowiazaneSzablony } from "@/components/grafika/banner-powiazane-szablony";
import { SekcjaPodobneSzablony } from "@/components/grafika/sekcja-podobne-szablony";
import { MOTYWY_GRAFIKI } from "@/lib/grafika/motywy";
import { zbudujSugestieGrafiki } from "@/lib/grafika/sugestie-kontekstowe";
import type { KontekstGrafiki, MotywGrafiki, ProfilWsiGrafiki, SzablonGrafiki } from "@/lib/grafika/typy";

type Props = {
  szablon: SzablonGrafiki;
  motyw: MotywGrafiki;
  motywId: string;
  wartosci: Record<string, string>;
  tytulProjektu: string;
  logoDataUrl: string | null;
  backgroundDataUrl: string | null;
  backgroundOverlay: number;
  qrUrl: string;
  sciezkaWsi: string;
  profilWsi: ProfilWsiGrafiki | null;
  toDyplom: boolean;
  trybSoltys: boolean;
  villageId: string | null;
  oczekuje: boolean;
  maProfil: boolean;
  wszystkieSzablony: SzablonGrafiki[];
  kontekst: KontekstGrafiki;
  onPole: (id: string, v: string) => void;
  onTytulProjektu: (v: string) => void;
  onMotyw: (id: string) => void;
  onLogo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTlo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUsunLogo: () => void;
  onUsunTlo: () => void;
  onTloZProfilu: () => void;
  onBackgroundOverlay: (v: number) => void;
  onQr: (v: string) => void;
  onWstawProfil: () => void;
  onPodpisCyfrowy: () => void;
  onLogoZProfilu: () => void;
  onUstawDateSezonowa: () => void;
  onWyborSzablon: (id: string) => void;
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
  backgroundOverlay,
  qrUrl,
  sciezkaWsi,
  profilWsi,
  toDyplom,
  trybSoltys,
  villageId,
  oczekuje,
  maProfil,
  wszystkieSzablony,
  kontekst,
  onPole,
  onTytulProjektu,
  onMotyw,
  onLogo,
  onTlo,
  onUsunLogo,
  onUsunTlo,
  onTloZProfilu,
  onBackgroundOverlay,
  onQr,
  onWstawProfil,
  onPodpisCyfrowy,
  onLogoZProfilu,
  onUstawDateSezonowa,
  onWyborSzablon,
  onWstecz,
  onDalej,
}: Props) {
  const sugestie = zbudujSugestieGrafiki(szablon, kontekst);

  return (
    <section className="space-y-4">
      <BannerPowiazaneSzablony szablonId={szablon.id} onWybor={onWyborSzablon} />

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
            <button
              type="button"
              onClick={onUstawDateSezonowa}
              className="rounded-lg border border-sky-700 bg-sky-50 px-3 py-2 text-sm text-sky-950 hover:bg-sky-100"
            >
              Ustaw datę sezonową
            </button>
          </div>
        ) : (
          <div className="mt-3">
            <button
              type="button"
              onClick={onUstawDateSezonowa}
              className="rounded-lg border border-sky-700 bg-sky-50 px-3 py-2 text-sm text-sky-950 hover:bg-sky-100"
            >
              Ustaw datę sezonową
            </button>
          </div>
        )}

        {sugestie.length > 0 ? (
          <div className="mt-4 space-y-2 rounded-xl border border-sky-100 bg-sky-50/50 p-3">
            <p className="text-xs font-semibold text-sky-900">Szybkie wstawki — kliknij chip</p>
            {sugestie.map((grupa) => (
              <div key={grupa.grupa}>
                <p className="text-[10px] font-medium uppercase tracking-wide text-sky-800/70">{grupa.grupa}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {grupa.sugestie.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => onPole(s.poleDocelowe, s.wartosc)}
                      className="rounded-full border border-sky-200 bg-white px-2.5 py-1 text-[11px] font-medium text-sky-950 hover:bg-sky-100"
                    >
                      {s.etykieta}
                    </button>
                  ))}
                </div>
              </div>
            ))}
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

      <SekcjaPodobneSzablony
        biezacy={szablon}
        wszystkie={wszystkieSzablony}
        kontekst={kontekst}
        onWybor={onWyborSzablon}
      />

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

        <div className="mt-5">
          <SekcjaTlaGrafiki
            backgroundDataUrl={backgroundDataUrl}
            backgroundOverlay={backgroundOverlay}
            villageId={villageId}
            trybSoltys={trybSoltys}
            maOkladkeWsi={Boolean(profilWsi?.zdjecieTloUrl)}
            oczekuje={oczekuje}
            onTlo={onTlo}
            onUsunTlo={onUsunTlo}
            onTloZProfilu={onTloZProfilu}
            onOverlay={onBackgroundOverlay}
          />
        </div>

        <details className="mt-5 rounded-lg border border-stone-200 bg-stone-50/80 px-3 py-2">
          <summary className="cursor-pointer text-sm font-medium text-stone-800">Logo i kod QR (opcjonalnie)</summary>
          <div className="mt-3 space-y-3 pb-2 text-sm">
            <label className="block">
              <span className="text-stone-700">Logo / herb (max 2 MB)</span>
              <p className="mt-0.5 text-[11px] text-stone-500">
                Domyślnie logo naszawies.pl — możesz podmienić na okładkę wsi lub własny znak.
              </p>
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
