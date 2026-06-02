"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  dodajDoKalendarzaZPlakatu,
  dodajOgloszenieZPlakatu,
  ustawPlakatNaTablicyCyfrowej,
} from "@/app/(site)/panel/grafika/akcje";

type Props = {
  projektId: string | null;
  maDate: boolean;
  trybSoltys: boolean;
  zapisDoBazy: boolean;
  linkedPostId?: string | null;
  linkedEventId?: string | null;
  featuredOnDigitalBoard?: boolean;
  onKomunikat: (tekst: string) => void;
  onBlad: (tekst: string) => void;
  onOdswiez?: () => void;
};

export function IntegracjaPlakatuKlient({
  projektId,
  maDate,
  trybSoltys,
  zapisDoBazy,
  linkedPostId = null,
  linkedEventId = null,
  featuredOnDigitalBoard = false,
  onKomunikat,
  onBlad,
  onOdswiez,
}: Props) {
  const [naTablicy, ustawNaTablicy] = useState(featuredOnDigitalBoard);
  const [oczekuje, startTransition] = useTransition();

  useEffect(() => {
    ustawNaTablicy(featuredOnDigitalBoard);
  }, [featuredOnDigitalBoard, projektId]);

  if (!trybSoltys || !zapisDoBazy) return null;

  const wymagajZapisu = () => {
    if (!projektId) {
      onBlad("Najpierw zapisz projekt, potem dodaj ogłoszenie lub wydarzenie.");
      return false;
    }
    return true;
  };

  const ogloszenie = () => {
    if (!wymagajZapisu() || linkedPostId) return;
    startTransition(async () => {
      const r = await dodajOgloszenieZPlakatu(projektId!);
      if ("blad" in r) {
        onBlad(r.blad);
        return;
      }
      onKomunikat("Ogłoszenie dodane na profil wsi (widoczne od razu).");
      onBlad("");
      onOdswiez?.();
    });
  };

  const kalendarz = () => {
    if (!wymagajZapisu() || linkedEventId) return;
    if (!maDate) {
      onBlad("Uzupełnij pole „Data” w kroku 2, aby dodać wydarzenie do kalendarza.");
      return;
    }
    startTransition(async () => {
      const r = await dodajDoKalendarzaZPlakatu(projektId!);
      if ("blad" in r) {
        onBlad(r.blad);
        return;
      }
      onKomunikat("Wydarzenie dodane do kalendarza społeczności wsi.");
      onBlad("");
      onOdswiez?.();
    });
  };

  const tablica = () => {
    if (!wymagajZapisu()) return;
    startTransition(async () => {
      const r = await ustawPlakatNaTablicyCyfrowej(projektId!, !naTablicy);
      if ("blad" in r) {
        onBlad(r.blad);
        return;
      }
      ustawNaTablicy(!naTablicy);
      onKomunikat(
        !naTablicy
          ? "Plakat będzie rotował na tablicy cyfrowej świetlicy (po publikacji na profilu)."
          : "Plakat usunięty z rotacji tablicy cyfrowej.",
      );
      onBlad("");
      onOdswiez?.();
    });
  };

  return (
    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
      <p className="text-sm font-semibold text-emerald-950">Powiązania z profilem wsi</p>
      <p className="mt-1 text-xs text-stone-600">
        Jeden klik — plakat staje się ogłoszeniem lub wpisem w kalendarzu wydarzeń.
      </p>

      {(linkedPostId || linkedEventId) && (
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          {linkedPostId ? (
            <span className="rounded-full bg-emerald-200/80 px-2.5 py-1 font-medium text-emerald-950">
              ✓ Ogłoszenie utworzone
            </span>
          ) : null}
          {linkedEventId ? (
            <span className="rounded-full bg-sky-200/80 px-2.5 py-1 font-medium text-sky-950">
              ✓ W kalendarzu wsi
            </span>
          ) : null}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={oczekuje || Boolean(linkedPostId)}
          onClick={ogloszenie}
          className="rounded-lg border border-emerald-800 bg-white px-3 py-2 text-sm text-emerald-900 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {linkedPostId ? "Ogłoszenie już dodane" : "Dodaj jako ogłoszenie"}
        </button>
        <button
          type="button"
          disabled={oczekuje || Boolean(linkedEventId) || !maDate}
          onClick={kalendarz}
          title={!maDate ? "Uzupełnij datę w kroku 2" : undefined}
          className="rounded-lg border border-emerald-800 bg-white px-3 py-2 text-sm text-emerald-900 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {linkedEventId ? "Już w kalendarzu" : "Dodaj do kalendarza"}
        </button>
        <button
          type="button"
          disabled={oczekuje}
          onClick={tablica}
          className={`rounded-lg border px-3 py-2 text-sm disabled:opacity-60 ${
            naTablicy
              ? "border-violet-800 bg-violet-100 text-violet-950"
              : "border-violet-700 bg-white text-violet-900 hover:bg-violet-50"
          }`}
        >
          {naTablicy ? "✓ Na tablicy cyfrowej" : "Pokaż na tablicy świetlicy"}
        </button>
      </div>
      <p className="mt-3 text-xs text-stone-600">
        Po imprezie dodaj zdjęcia do{" "}
        <Link href="/panel/soltys/fotokronika" className="text-green-800 underline">
          fotokroniki wsi
        </Link>
        . Kod QR „Fotokronika” w kroku 3 zachęci mieszkańców do wysyłania zdjęć.
      </p>
    </div>
  );
}
