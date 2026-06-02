"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { zapiszGalerieProfiluSwietlicy } from "@/app/(site)/panel/soltys/akcje";
import {
  ETYKIETY_ZDJEC_PROFILU_SWIETLICY,
  MAX_ZDJEC_PROFILU_SALI,
  type ZdjecieProfiluSali,
} from "@/lib/swietlica/zdjecia-profilu-sali";
import { czyKlientUzywaMagazynuR2 } from "@/lib/storage/czy-magazyn-r2";
import { wgrajObrazDoMagazynuR2 } from "@/lib/storage/wgraj-obraz-r2";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";
import { ObrazR2 } from "@/components/media/obraz-r2";

const MAX_BAJTOW = 4 * 1024 * 1024;
const MIME = ["image/jpeg", "image/png", "image/webp"] as const;

type Props = {
  hallId: string;
  poczatkowe: ZdjecieProfiluSali[];
};

async function wgrajPlik(hallId: string, plik: File): Promise<string | { blad: string }> {
  if (czyKlientUzywaMagazynuR2()) {
    const fd = new FormData();
    fd.set("typ", "hall_profile");
    fd.set("hallId", hallId);
    fd.set("file", plik);
    const w = await wgrajObrazDoMagazynuR2(fd);
    if ("blad" in w) return { blad: w.blad };
    return w.publicUrl;
  }

  const supabase = utworzKlientaSupabasePrzegladarka();
  const ext = plik.type === "image/png" ? "png" : plik.type === "image/webp" ? "webp" : "jpg";
  const sciezka = `${hallId}/profil/${crypto.randomUUID()}.${ext}`;
  const { error: uploadBlad } = await supabase.storage.from("hall_inventory").upload(sciezka, plik, {
    cacheControl: "3600",
    upsert: false,
    contentType: plik.type,
  });
  if (uploadBlad) {
    return {
      blad: uploadBlad.message.includes("Bucket not found")
        ? "Zapisywanie zdjęć jest chwilowo niedostępne."
        : uploadBlad.message,
    };
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from("hall_inventory").getPublicUrl(sciezka);
  return publicUrl;
}

export function GaleriaProfiluSwietlicyEdytorKlient({ hallId, poczatkowe }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [zdjecia, ustawZdjecia] = useState<ZdjecieProfiluSali[]>(poczatkowe);
  const [blad, ustawBlad] = useState("");
  const [komunikat, ustawKomunikat] = useState<string | null>(null);
  const [oczekuje, startTransition] = useTransition();

  async function zapisz(nowaLista: ZdjecieProfiluSali[]) {
    ustawBlad("");
    ustawKomunikat(null);
    return new Promise<boolean>((resolve) => {
      startTransition(async () => {
        const wynik = await zapiszGalerieProfiluSwietlicy({ hallId, zdjecia: nowaLista });
        if ("blad" in wynik) {
          ustawBlad(wynik.blad);
          resolve(false);
          return;
        }
        ustawZdjecia(nowaLista);
        ustawKomunikat("Zapisano galerię profilu.");
        router.refresh();
        resolve(true);
      });
    });
  }

  async function onWyborPliku(plik: File | null) {
    if (!plik) return;
    ustawBlad("");
    ustawKomunikat(null);
    if (zdjecia.length >= MAX_ZDJEC_PROFILU_SALI) {
      ustawBlad(`Maksymalnie ${MAX_ZDJEC_PROFILU_SALI} zdjęć.`);
      return;
    }
    if (!MIME.includes(plik.type as (typeof MIME)[number])) {
      ustawBlad("Dozwolone: JPEG, PNG, WebP.");
      return;
    }
    if (plik.size > MAX_BAJTOW) {
      ustawBlad("Maksymalnie 4 MB na zdjęcie.");
      return;
    }

    const wgrany = await wgrajPlik(hallId, plik);
    if (typeof wgrany !== "string") {
      ustawBlad(wgrany.blad);
      return;
    }

    const nowe: ZdjecieProfiluSali = {
      id: crypto.randomUUID(),
      url: wgrany,
      etykieta: ETYKIETY_ZDJEC_PROFILU_SWIETLICY[0],
    };
    const ok = await zapisz([...zdjecia, nowe]);
    if (!ok) return;
    if (inputRef.current) inputRef.current.value = "";
  }

  async function zmienEtykiete(id: string, etykieta: string) {
    const nowa = zdjecia.map((z) => (z.id === id ? { ...z, etykieta } : z));
    await zapisz(nowa);
  }

  async function usun(id: string) {
    const nowa = zdjecia.filter((z) => z.id !== id);
    await zapisz(nowa);
  }

  async function przesun(id: string, kierunek: -1 | 1) {
    const idx = zdjecia.findIndex((z) => z.id === id);
    if (idx < 0) return;
    const cel = idx + kierunek;
    if (cel < 0 || cel >= zdjecia.length) return;
    const kopia = [...zdjecia];
    [kopia[idx], kopia[cel]] = [kopia[cel], kopia[idx]];
    await zapisz(kopia);
  }

  return (
    <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4" id="galeria-profilu-swietlicy">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Zdjęcia profilowe budynku</h3>
          <p className="mt-1 text-xs text-stone-500">
            Do {MAX_ZDJEC_PROFILU_SALI} zdjęć — sala, kuchnia, łazienka, plac zabaw i inne. Pierwsze zdjęcie to
            okładka na profilu wsi.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center rounded-lg bg-green-800 px-3 py-2 text-sm font-medium text-white hover:bg-green-900 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
          {oczekuje ? "Zapisuję…" : "Dodaj zdjęcie"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={oczekuje || zdjecia.length >= MAX_ZDJEC_PROFILU_SALI}
            onChange={(e) => void onWyborPliku(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {komunikat ? <p className="mt-2 text-sm text-green-800">{komunikat}</p> : null}
      {blad ? (
        <p className="mt-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}

      {zdjecia.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-stone-200 bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">
          Brak zdjęć — dodaj pierwsze, aby mieszkańcy zobaczyli wnętrze i otoczenie świetlicy.
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {zdjecia.map((z, i) => (
            <li key={z.id} className="overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
              <div className="relative aspect-[4/3] bg-stone-100">
                <ObrazR2 src={z.url} alt={z.etykieta} preset="karta" className="h-full w-full object-cover" />
                {i === 0 ? (
                  <span className="absolute left-2 top-2 rounded-full bg-green-900/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Okładka
                  </span>
                ) : null}
              </div>
              <div className="space-y-2 p-3">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-stone-500">
                    Opis miejsca
                  </span>
                  <select
                    value={ETYKIETY_ZDJEC_PROFILU_SWIETLICY.includes(
                      z.etykieta as (typeof ETYKIETY_ZDJEC_PROFILU_SWIETLICY)[number],
                    )
                      ? z.etykieta
                      : "Inne"}
                    disabled={oczekuje}
                    onChange={(e) => void zmienEtykiete(z.id, e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-sm"
                  >
                    {ETYKIETY_ZDJEC_PROFILU_SWIETLICY.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={oczekuje || i === 0}
                    onClick={() => void przesun(z.id, -1)}
                    className="rounded border border-stone-300 px-2 py-1 text-xs text-stone-700 hover:bg-white disabled:opacity-40"
                  >
                    ← W lewo
                  </button>
                  <button
                    type="button"
                    disabled={oczekuje || i === zdjecia.length - 1}
                    onClick={() => void przesun(z.id, 1)}
                    className="rounded border border-stone-300 px-2 py-1 text-xs text-stone-700 hover:bg-white disabled:opacity-40"
                  >
                    W prawo →
                  </button>
                  <button
                    type="button"
                    disabled={oczekuje}
                    onClick={() => void usun(z.id)}
                    className="ml-auto text-xs text-red-800 underline disabled:opacity-40"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
