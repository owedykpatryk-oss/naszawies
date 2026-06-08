"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { uruchomAutomatyczneDodatkiSoltysa } from "@/app/(site)/panel/soltys/akcje-automatyzacja-dodatkow";
import type { KatalogMozliwosciSoltysa, MozliwoscSoltysa } from "@/lib/panel/katalog-mozliwosci-soltysa";

const ETYKIETA_KATEGORII: Record<string, string> = {
  mapa: "Mapa i miejsca",
  komunikacja: "Komunikacja z mieszkańcami",
  organizacja: "Organizacja i dokumenty",
  bezpieczenstwo: "Bezpieczeństwo",
  transport: "Transport",
};

type Props = {
  katalog: KatalogMozliwosciSoltysa;
  kompaktowy?: boolean;
};

export function SoltysKatalogMozliwosci({ katalog, kompaktowy }: Props) {
  const router = useRouter();
  const [czek, start] = useTransition();
  const [komunikat, ustawKomunikat] = useState<string | null>(null);
  const [blad, ustawBlad] = useState<string | null>(null);
  const [filtr, ustawFiltr] = useState<"wszystkie" | "do_uruchomienia" | "wlaczone">("do_uruchomienia");

  const pozycje =
    filtr === "wszystkie"
      ? katalog.pozycje
      : katalog.pozycje.filter((p) =>
          filtr === "do_uruchomienia" ? p.status === "do_uruchomienia" : p.status === "wlaczone" || p.status === "narzedzie",
        );

  const doAuto = katalog.pozycje.filter((p) => p.status === "do_uruchomienia" && p.automatyczne);

  function uruchomAuto() {
    ustawBlad(null);
    ustawKomunikat(null);
    start(async () => {
      const w = await uruchomAutomatyczneDodatkiSoltysa();
      if (!w.ok) {
        ustawBlad(w.blad);
        return;
      }
      ustawKomunikat(
        w.komunikaty.length > 0
          ? w.komunikaty.join(" · ")
          : "Zakończono — sprawdź mapę i profil wsi.",
      );
      if (w.bledy.length > 0) {
        ustawBlad(w.bledy.slice(0, 2).join("; "));
      }
      router.refresh();
    });
  }

  const procent =
    katalog.lacznie > 0
      ? Math.round(((katalog.wlaczone + katalog.pozycje.filter((p) => p.status === "narzedzie").length) / katalog.lacznie) * 100)
      : 0;

  if (kompaktowy) {
    const top = katalog.pozycje.filter((p) => p.status === "do_uruchomienia").slice(0, 4);
    if (top.length === 0) return null;
    return (
      <section className="mt-4 rounded-xl border border-sky-200/80 bg-sky-50/50 p-4">
        <p className="text-sm font-semibold text-sky-950">Co jeszcze możesz włączyć</p>
        <ul className="mt-2 space-y-1 text-xs text-stone-700">
          {top.map((p) => (
            <li key={p.id}>
              <Link href={p.href} className="font-medium text-green-900 underline">
                {p.ikona} {p.tytul}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/panel/soltys#katalog-dodatkow" className="mt-2 inline-block text-xs font-medium text-green-800 underline">
          Pełna lista w panelu sołtysa →
        </Link>
      </section>
    );
  }

  return (
    <section
      id="katalog-dodatkow"
      className="mb-8 rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50/70 via-white to-emerald-50/40 p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sky-800">
            Automatyczne dodatki
          </p>
          <h2 className="mt-1 font-serif text-xl text-green-950">Co możesz włączyć dla mieszkańców</h2>
          <p className="mt-1 text-sm text-stone-600">
            Włączone lub gotowe narzędzia: <strong>{katalog.wlaczone}</strong> · Do uruchomienia:{" "}
            <strong>{katalog.doUruchomienia}</strong> · Postęp ok. {procent}%
          </p>
          <div
            className="mt-2 h-2 max-w-lg overflow-hidden rounded-full bg-stone-200"
            role="progressbar"
            aria-valuenow={procent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-sky-600 transition-[width]" style={{ width: `${procent}%` }} />
          </div>
        </div>
        {doAuto.length > 0 ? (
          <button
            type="button"
            disabled={czek}
            onClick={uruchomAuto}
            className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-60"
          >
            {czek ? "Trwa…" : "Włącz automatycznie (mapa + transport)"}
          </button>
        ) : null}
      </div>

      {!katalog.transportPlatforma ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
          Automatyczne rozkłady PKP/GTFS wymagają konfiguracji u administratora platformy. Możesz jednak{" "}
          <Link href="/panel/soltys/transport" className="font-medium underline">
            wpisać rozkład PKS ręcznie
          </Link>{" "}
          przy przystankach na mapie.
        </p>
      ) : null}

      {komunikat ? <p className="mt-2 text-sm text-green-800">{komunikat}</p> : null}
      {blad ? <p className="mt-2 text-sm text-red-800">{blad}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {(["do_uruchomienia", "wlaczone", "wszystkie"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => ustawFiltr(f)}
            className={`rounded-full border px-3 py-1 font-medium ${
              filtr === f
                ? "border-sky-600 bg-sky-100 text-sky-950"
                : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
            }`}
          >
            {f === "do_uruchomienia" ? "Do włączenia" : f === "wlaczone" ? "Aktywne" : "Wszystkie"}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-6">
        {Object.entries(
          pozycje.reduce<Record<string, MozliwoscSoltysa[]>>((acc, p) => {
            const arr = acc[p.kategoria] ?? [];
            arr.push(p);
            acc[p.kategoria] = arr;
            return acc;
          }, {}),
        ).map(([kat, lista]) => (
          <div key={kat}>
            <h3 className="text-xs font-bold uppercase tracking-wide text-stone-500">
              {ETYKIETA_KATEGORII[kat] ?? kat}
            </h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {lista.map((p) => (
                <KartaMozliwosci key={p.id} pozycja={p} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-stone-500">
        <Link href="/panel/pierwsze-kroki" className="text-green-800 underline">
          Przewodnik pierwszych kroków
        </Link>
        {" · "}
        <Link href="/panel/soltys/pomoc" className="text-green-800 underline">
          Pomoc krok po kroku
        </Link>
      </p>
    </section>
  );
}

function KartaMozliwosci({ pozycja: p }: { pozycja: MozliwoscSoltysa }) {
  const styl =
    p.status === "wlaczone"
      ? "border-emerald-200 bg-emerald-50/50"
      : p.status === "narzedzie"
        ? "border-stone-200 bg-stone-50/80"
        : "border-amber-200/90 bg-white";

  return (
    <li className={`rounded-xl border p-3 text-sm ${styl}`}>
      <p className="font-medium text-green-950">
        <span aria-hidden="true">{p.ikona} </span>
        {p.tytul}
        {p.status === "wlaczone" ? (
          <span className="ml-1 text-xs font-normal text-emerald-800">· włączone</span>
        ) : null}
        {p.automatyczne && p.status === "do_uruchomienia" ? (
          <span className="ml-1 text-xs font-normal text-sky-800">· auto</span>
        ) : null}
      </p>
      <p className="mt-1 text-xs text-stone-600">
        <strong>Mieszkańcy:</strong> {p.coDostajaMieszkancy}
      </p>
      <p className="mt-0.5 text-xs text-stone-500">{p.coRobiSoltys}</p>
      {p.wskazowka ? <p className="mt-1 text-xs italic text-amber-900/90">{p.wskazowka}</p> : null}
      <Link href={p.href} className="mt-2 inline-block text-xs font-medium text-green-800 underline">
        {p.status === "do_uruchomienia" ? "Włącz →" : "Otwórz →"}
      </Link>
    </li>
  );
}
