"use client";

import { useState } from "react";
import Link from "next/link";
import { aktualizujRelacjeTransportowa, odswiezStacjeDoceloweRelacji } from "@/app/(site)/panel/moje/akcje-transport";
export type RelacjaTransportowaPelna = {
  id: string;
  villageId: string;
  wiesNazwa: string;
  wiesSciezka: string;
  relationKey: string;
  title: string;
  targetLabel: string | null;
  targetStationId: string | null;
  targetStationName: string | null;
  notifyDelayMin: number;
  notifyCancelled: boolean;
  notifyDisruptions: boolean;
  isActive: boolean;
};

export function MojeTransportUstawieniaKlient({ relacje }: { relacje: RelacjaTransportowaPelna[] }) {
  const [komunikat, setKomunikat] = useState<string | null>(null);
  const [ladowanie, setLadowanie] = useState(false);

  async function zapisz(r: RelacjaTransportowaPelna, patch: Partial<RelacjaTransportowaPelna>) {
    setLadowanie(true);
    const res = await aktualizujRelacjeTransportowa({
      id: r.id,
      notifyDelayMin: patch.notifyDelayMin ?? r.notifyDelayMin,
      notifyCancelled: patch.notifyCancelled ?? r.notifyCancelled,
      notifyDisruptions: patch.notifyDisruptions ?? r.notifyDisruptions,
      isActive: patch.isActive ?? r.isActive,
    });
    setLadowanie(false);
    if (!res.ok) setKomunikat(res.blad);
    else setKomunikat("Zapisano ustawienia.");
  }

  async function odswiezStacje() {
    setLadowanie(true);
    const res = await odswiezStacjeDoceloweRelacji();
    setLadowanie(false);
    if (!res.ok) setKomunikat(res.blad);
    else {
      setKomunikat(`Zaktualizowano stacje docelowe (${res.zaktualizowano ?? 0} relacji).`);
      window.location.reload();
    }
  }

  if (relacje.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        Brak relacji transportowych. Złóż wniosek o rolę we wsi w{" "}
        <Link href="/panel/mieszkaniec" className="text-green-800 underline">
          panelu mieszkańca
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-600">
        Ustaw progi powiadomień o opóźnieniach kolei. Relacja „do miasta powiatowego” dostaje osobny alert, gdy opóźnione jest
        połączenie w tym kierunku (po przypisaniu stacji PKP).
      </p>
      <button type="button" className="btn-panel-secondary text-sm" disabled={ladowanie} onClick={() => void odswiezStacje()}>
        Odśwież stacje docelowe (PKP)
      </button>
      {komunikat ? <p className="text-sm text-amber-900">{komunikat}</p> : null}

      <ul className="space-y-4">
        {relacje.map((r) => (
          <li key={r.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-green-950">{r.title}</p>
                <p className="text-xs text-stone-500">
                  <Link href={r.wiesSciezka} className="underline">
                    {r.wiesNazwa}
                  </Link>
                  {r.targetLabel ? ` · ${r.targetLabel}` : ""}
                </p>
                {r.targetStationName ? (
                  <p className="mt-1 text-xs text-stone-600">
                    Stacja docelowa PKP: <strong>{r.targetStationName}</strong>
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-amber-800">Brak stacji docelowej — kliknij „Odśwież stacje docelowe”.</p>
                )}
              </div>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={r.isActive}
                  onChange={(e) => void zapisz(r, { isActive: e.target.checked })}
                />
                Aktywna
              </label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-xs">
                <span className="font-medium text-stone-700">Alert od opóźnienia (min)</span>
                <input
                  type="number"
                  min={1}
                  max={240}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-2 py-1.5"
                  defaultValue={r.notifyDelayMin}
                  onBlur={(e) => {
                    const v = Number.parseInt(e.target.value, 10);
                    if (Number.isFinite(v) && v !== r.notifyDelayMin) void zapisz(r, { notifyDelayMin: v });
                  }}
                />
              </label>
              <label className="flex items-center gap-2 text-xs sm:mt-5">
                <input
                  type="checkbox"
                  defaultChecked={r.notifyDisruptions}
                  onChange={(e) => void zapisz(r, { notifyDisruptions: e.target.checked })}
                />
                Opóźnienia
              </label>
              <label className="flex items-center gap-2 text-xs sm:mt-5">
                <input
                  type="checkbox"
                  defaultChecked={r.notifyCancelled}
                  onChange={(e) => void zapisz(r, { notifyCancelled: e.target.checked })}
                />
                Odwołania
              </label>
            </div>

            <p className="mt-3 text-xs">
              <Link href={`${r.wiesSciezka}#sekcja-transport`} className="text-green-800 underline">
                Zobacz transport na profilu wsi
              </Link>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
