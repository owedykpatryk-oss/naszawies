"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { zapiszZdjecieFotokroniki, type WynikFoto } from "../akcje-fotokronika";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";

const MAX_BAJTOW = 5 * 1024 * 1024;
const MIME = ["image/jpeg", "image/png", "image/webp"] as const;

type Wies = { id: string; name: string };
type Album = { id: string; title: string; village_id: string };
type Uzytk = { id: string };

type Props = { wies: Wies[]; albumy: Album[]; uzytkownik: Uzytk };

export function FotokronikaDodajKlient({ wies, albumy, uzytkownik }: Props) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();
  const [vId, ustawVId] = useState(wies[0]?.id ?? "");
  const albumyFilt = useMemo(() => albumy.filter((a) => a.village_id === vId), [albumy, vId]);

  if (wies.length === 0) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        Aby korzystać z fotokroniki, potrzebujesz <strong>aktywnej roli</strong> we wsi — wniosek:{" "}
        <a href="/panel/mieszkaniec" className="font-medium text-green-800 underline">
          panel mieszkańca
        </a>
        .
      </p>
    );
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    const fd = new FormData(e.currentTarget);
    const caption = String(fd.get("caption") || "").trim();
    const taken = String(fd.get("taken_at") || "");
    const plik = (fd.get("plik") as File) ?? null;
    const albumWyb = String(fd.get("album_id") || "").trim();
    if (!vId) {
      ustawBlad("Wybierz wieś.");
      return;
    }
    if (!plik || plik.size === 0) {
      ustawBlad("Dodaj plik zdjęcia.");
      return;
    }
    if (!MIME.includes(plik.type as (typeof MIME)[number]) || plik.size > MAX_BAJTOW) {
      ustawBlad("Dozwolone: JPEG, PNG, WebP, maks. 5 MB.");
      return;
    }

    startT(async () => {
      const supabase = utworzKlientaSupabasePrzegladarka();
      const ext = plik.type === "image/png" ? "png" : plik.type === "image/webp" ? "webp" : "jpg";
      const sciezka = `${vId}/${uzytkownik.id}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
      const { error: uE } = await supabase.storage.from("village_photos").upload(sciezka, plik, {
        contentType: plik.type,
        cacheControl: "3600",
        upsert: false,
      });
      if (uE) {
        ustawBlad(
          uE.message.includes("Bucket not found")
            ? "Zapisywanie zdjęć jest chwilowo niedostępne. Spróbuj później lub skontaktuj się z obsługą serwisu."
            : uE.message
        );
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("village_photos").getPublicUrl(sciezka);

      let takenIso: string | null = null;
      if (taken) {
        const t = new Date(taken);
        if (!Number.isNaN(t.getTime())) takenIso = t.toISOString();
      }

      const w: WynikFoto = await zapiszZdjecieFotokroniki({
        villageId: vId,
        albumId: albumWyb || null,
        url: publicUrl,
        caption: caption || null,
        takenAt: takenIso,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      (e.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="forms-premium mt-6 space-y-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
    >
      {blad ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}
      <h2 className="font-serif text-lg text-green-950">Dodaj zdjęcie</h2>
      <p className="text-sm text-stone-600">
        Zdjęcie trafia do <strong>moderacji</strong>. Po zatwierdzeniu przez sołtysa będzie widoczne w fotokronice (wg
        ustawień albumu i widoczności).
      </p>
      <div>
        <label className="mb-1 block" htmlFor="foto-wies">
          Wieś
        </label>
        <select id="foto-wies" value={vId} onChange={(e) => ustawVId(e.target.value)}>
          {wies.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block" htmlFor="foto-album">
          Album (opcjonalnie)
        </label>
        <select id="foto-album" name="album_id">
          <option value="">— bez przypisania (sołtys może dodać do albumu później) —</option>
          {albumyFilt.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
        {albumyFilt.length === 0 ? (
          <p className="mt-1 text-xs text-stone-500">Brak albumów w tej wsi — sołtys może utworzyć je w swoim panelu.</p>
        ) : null}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="foto-plik">
          Plik
        </label>
        <input
          id="foto-plik"
          name="plik"
          type="file"
          required
          accept="image/jpeg,image/png,image/webp"
          className="w-full text-sm file:mr-2 file:rounded file:border-0 file:bg-green-100 file:px-3 file:py-1.5"
        />
      </div>
      <div>
        <label className="mb-1 block" htmlFor="foto-opis">
          Opis
        </label>
        <input id="foto-opis" name="caption" maxLength={2000} />
      </div>
      <div>
        <label className="mb-1 block" htmlFor="foto-taken">
          Kiedy wykonano zdjęcie (opcjonalnie)
        </label>
        <input id="foto-taken" name="taken_at" type="datetime-local" className="w-full max-w-sm" />
      </div>
      <button
        type="submit"
        disabled={czek}
        className="rounded-lg bg-green-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-900 disabled:opacity-50"
      >
        {czek ? "Wgrywam…" : "Wyślij do moderacji"}
      </button>
    </form>
  );
}
