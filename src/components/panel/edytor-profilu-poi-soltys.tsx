"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState, useTransition } from "react";
import { zapiszGalerieProfiluPoi, zapiszTrescProfiluPoi } from "@/app/(site)/panel/soltys/akcje-poi-profil";
import { etykietaKategoriiPoi } from "@/lib/mapa/kategorie-poi";
import {
  ETYKIETY_ZDJEC_PROFILU_POI,
  MAX_ZDJEC_GALERII_POI,
  type ZdjecieProfiluPoi,
} from "@/lib/mapa/zdjecia-profilu-poi";
import { czyKlientUzywaMagazynuR2 } from "@/lib/storage/czy-magazyn-r2";
import { wgrajObrazDoMagazynuR2 } from "@/lib/storage/wgraj-obraz-r2";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";

export type PoiDoEdycjiProfilu = {
  id: string;
  name: string;
  category: string;
  story_text: string | null;
  facts_text: string | null;
  photo_url: string | null;
  photo_caption: string | null;
  gallery_photos: unknown;
};

async function wgrajZdjecie(villageId: string, poiId: string, plik: File): Promise<string | { blad: string }> {
  if (plik.size > 5 * 1024 * 1024) return { blad: "Max 5 MB na zdjęcie." };
  if (czyKlientUzywaMagazynuR2()) {
    const fd = new FormData();
    fd.set("typ", "village_photos");
    fd.set("villageId", villageId);
    fd.set("podkatalog", "poi");
    fd.set("file", plik);
    const w = await wgrajObrazDoMagazynuR2(fd);
    if ("blad" in w) return { blad: w.blad };
    return w.publicUrl;
  }
  const supabase = utworzKlientaSupabasePrzegladarka();
  const ext = plik.type === "image/png" ? "png" : plik.type === "image/webp" ? "webp" : "jpg";
  const sciezka = `${villageId}/poi/${poiId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("village_photos").upload(sciezka, plik, {
    cacheControl: "3600",
    upsert: false,
    contentType: plik.type,
  });
  if (error) return { blad: "Nie udało się wgrać zdjęcia." };
  const {
    data: { publicUrl },
  } = supabase.storage.from("village_photos").getPublicUrl(sciezka);
  return publicUrl;
}

export function EdytorProfiluPoiSoltys({
  villageId,
  pois,
}: {
  villageId: string;
  pois: PoiDoEdycjiProfilu[];
}) {
  const router = useRouter();
  const inputGaleriaRef = useRef<HTMLInputElement>(null);
  const [wybranyId, ustawWybranyId] = useState(pois[0]?.id ?? "");
  const [blad, ustawBlad] = useState("");
  const [ok, ustawOk] = useState("");
  const [czek, startT] = useTransition();

  const wybrany = pois.find((p) => p.id === wybranyId) ?? pois[0];
  const galeriaPoczatkowa: ZdjecieProfiluPoi[] = Array.isArray(wybrany?.gallery_photos)
    ? (wybrany.gallery_photos as ZdjecieProfiluPoi[])
    : [];
  const [galeria, ustawGalerie] = useState<ZdjecieProfiluPoi[]>(galeriaPoczatkowa);

  if (pois.length === 0) {
    return (
      <p className="text-sm text-stone-600">
        Najpierw dodaj punkty na mapie (import z OSM lub ręcznie), potem uzupełnij historię i zdjęcia.
      </p>
    );
  }

  function onTresc(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!wybrany) return;
    ustawBlad("");
    ustawOk("");
    const fd = new FormData(e.currentTarget);
    startT(async () => {
      const w = await zapiszTrescProfiluPoi({
        poiId: wybrany.id,
        storyText: String(fd.get("story_text") ?? ""),
        factsText: String(fd.get("facts_text") ?? ""),
        photoCaption: String(fd.get("photo_caption") ?? "") || null,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawOk("Zapisano treść profilu.");
      router.refresh();
    });
  }

  async function onOkladka(plik: File) {
    if (!wybrany) return;
    ustawBlad("");
    const url = await wgrajZdjecie(villageId, wybrany.id, plik);
    if (typeof url !== "string") {
      ustawBlad(url.blad);
      return;
    }
    startT(async () => {
      const w = await zapiszTrescProfiluPoi({
        poiId: wybrany.id,
        photoUrl: url,
        photoPath: null,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawOk("Zapisano zdjęcie okładki.");
      router.refresh();
    });
  }

  async function dodajDoGalerii(plik: File, etykieta: string) {
    if (!wybrany || galeria.length >= MAX_ZDJEC_GALERII_POI) return;
    const url = await wgrajZdjecie(villageId, wybrany.id, plik);
    if (typeof url !== "string") {
      ustawBlad(url.blad);
      return;
    }
    const nowa = [...galeria, { id: crypto.randomUUID(), url, etykieta }];
    startT(async () => {
      const w = await zapiszGalerieProfiluPoi({ poiId: wybrany.id, zdjecia: nowa });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawGalerie(nowa);
      ustawOk("Dodano zdjęcie do galerii.");
      router.refresh();
    });
  }

  function usunZGalerii(id: string) {
    if (!wybrany) return;
    const nowa = galeria.filter((z) => z.id !== id);
    startT(async () => {
      const w = await zapiszGalerieProfiluPoi({ poiId: wybrany.id, zdjecia: nowa });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawGalerie(nowa);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600">
        Uzupełnij <strong>historię</strong>, <strong>ciekawostki</strong> i <strong>galerię</strong> — to trafia na publiczną
        stronę miejsca (<code className="rounded bg-stone-100 px-1">/mapa/miejsce/…</code>), nie tylko komentarze. Wpisy kroniki
        wsi powiąż w{" "}
        <Link href="/panel/soltys/spolecznosc?tryb=historia" className="text-green-800 underline">
          Społeczność → Historia
        </Link>
        .
      </p>

      <label className="block text-sm">
        Punkt na mapie
        <select
          value={wybrany?.id ?? ""}
          onChange={(e) => {
            ustawWybranyId(e.target.value);
            const p = pois.find((x) => x.id === e.target.value);
            ustawGalerie(Array.isArray(p?.gallery_photos) ? (p.gallery_photos as ZdjecieProfiluPoi[]) : []);
            ustawBlad("");
            ustawOk("");
          }}
          className="mt-1 block w-full max-w-lg rounded-lg border border-stone-300 px-2 py-1.5"
        >
          {pois.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({etykietaKategoriiPoi(p.category) ?? p.category})
            </option>
          ))}
        </select>
      </label>

      {blad ? <p className="text-sm text-red-800">{blad}</p> : null}
      {ok ? <p className="text-sm text-emerald-800">{ok}</p> : null}

      {wybrany ? (
        <>
          <div className="flex flex-wrap items-start gap-4 rounded-xl border border-stone-200 bg-white p-4">
            <div>
              <p className="text-xs font-medium text-stone-600">Zdjęcie okładki (hero)</p>
              {wybrany.photo_url ? (
                <div className="relative mt-2 h-28 w-44 overflow-hidden rounded-lg border border-stone-200">
                  <Image src={wybrany.photo_url} alt="" fill className="object-cover" sizes="176px" />
                </div>
              ) : (
                <p className="mt-2 text-xs text-stone-500">Brak — dodaj poniżej.</p>
              )}
            </div>
            <label className="text-sm">
              Wgraj okładkę
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="mt-1 block text-xs"
                disabled={czek}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onOkladka(f);
                  e.target.value = "";
                }}
              />
            </label>
            <Link href={`/mapa/miejsce/${wybrany.id}`} className="text-sm text-green-800 underline" target="_blank">
              Podgląd publiczny ↗
            </Link>
          </div>

          <form key={wybrany.id} onSubmit={onTresc} className="space-y-3 rounded-xl border border-stone-200 bg-white p-4">
            <label className="block text-sm">
              Historia miejsca
              <textarea
                name="story_text"
                rows={6}
                maxLength={8000}
                defaultValue={wybrany.story_text ?? ""}
                placeholder="np. Kościół wzniesiono w… W czasie II wojny…"
                className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-1.5 font-mono text-sm"
              />
            </label>
            <label className="block text-sm">
              Ciekawostki
              <textarea
                name="facts_text"
                rows={4}
                maxLength={3000}
                defaultValue={wybrany.facts_text ?? ""}
                placeholder="np. Najstarsza figura w ołtarzu pochodzi z… Dzwony odlano w…"
                className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-1.5"
              />
            </label>
            <label className="block text-sm">
              Podpis pod okładką
              <input
                name="photo_caption"
                maxLength={300}
                defaultValue={wybrany.photo_caption ?? ""}
                placeholder="np. Widok od strony drogi do Studzienek"
                className="mt-1 block w-full rounded-lg border border-stone-300 px-2 py-1.5"
              />
            </label>
            <button type="submit" disabled={czek} className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white">
              {czek ? "Zapisuję…" : "Zapisz treść"}
            </button>
          </form>

          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-sm font-medium text-green-950">
              Galeria ({galeria.length}/{MAX_ZDJEC_GALERII_POI})
            </p>
            {galeria.length > 0 ? (
              <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                {galeria.map((z) => (
                  <li key={z.id} className="relative overflow-hidden rounded-lg border border-stone-100">
                    <div className="relative aspect-[4/3]">
                      <Image src={z.url} alt={z.etykieta} fill className="object-cover" sizes="200px" />
                    </div>
                    <p className="px-2 py-1 text-[10px] text-stone-600">{z.etykieta}</p>
                    <button
                      type="button"
                      onClick={() => usunZGalerii(z.id)}
                      className="absolute right-1 top-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white"
                    >
                      Usuń
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {galeria.length < MAX_ZDJEC_GALERII_POI ? (
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <select id={`etykieta-galerii-${wybrany.id}`} className="rounded-lg border border-stone-300 px-2 py-1 text-sm">
                  {ETYKIETY_ZDJEC_PROFILU_POI.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
                <input
                  ref={inputGaleriaRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="text-xs"
                  disabled={czek}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    const sel = document.getElementById(`etykieta-galerii-${wybrany.id}`) as HTMLSelectElement | null;
                    if (f) void dodajDoGalerii(f, sel?.value ?? "Inne");
                    e.target.value = "";
                  }}
                />
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
