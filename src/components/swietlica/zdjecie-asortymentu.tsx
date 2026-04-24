"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ustawZdjecieWyposazeniaSwietlicy } from "@/app/(site)/panel/soltys/akcje";
import { czyKlientUzywaMagazynuR2 } from "@/lib/storage/czy-magazyn-r2";
import { wgrajObrazDoMagazynuR2 } from "@/lib/storage/wgraj-obraz-r2";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";

const MAX_BAJTOW = 3 * 1024 * 1024;
const MIME = ["image/jpeg", "image/png", "image/webp"] as const;

type Props = {
  hallId: string;
  pozycjaId: string;
  imageUrl: string | null;
};

export function ZdjecieAsortymentu({ hallId, pozycjaId, imageUrl }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [laduje, ustawLaduje] = useState(false);
  const [blad, ustawBlad] = useState("");

  async function onWyborPliku(plik: File | null) {
    if (!plik) return;
    ustawBlad("");
    if (!MIME.includes(plik.type as (typeof MIME)[number])) {
      ustawBlad("Dozwolone: JPEG, PNG, WebP.");
      return;
    }
    if (plik.size > MAX_BAJTOW) {
      ustawBlad("Maksymalnie 3 MB.");
      return;
    }

    ustawLaduje(true);
    try {
      let publicUrl: string;

      if (czyKlientUzywaMagazynuR2()) {
        const fd = new FormData();
        fd.set("typ", "inventory");
        fd.set("hallId", hallId);
        fd.set("pozycjaId", pozycjaId);
        fd.set("file", plik);
        const w = await wgrajObrazDoMagazynuR2(fd);
        if ("blad" in w) {
          ustawBlad(w.blad);
          return;
        }
        publicUrl = w.publicUrl;
      } else {
        const supabase = utworzKlientaSupabasePrzegladarka();
        const ext = plik.type === "image/png" ? "png" : plik.type === "image/webp" ? "webp" : "jpg";
        const sciezka = `${hallId}/${pozycjaId}-${Date.now()}.${ext}`;

        const { error: uploadBlad } = await supabase.storage.from("hall_inventory").upload(sciezka, plik, {
          cacheControl: "3600",
          upsert: false,
          contentType: plik.type,
        });
        if (uploadBlad) {
          ustawBlad(
            uploadBlad.message.includes("Bucket not found")
              ? "Zapisywanie zdjęć jest chwilowo niedostępne. Spróbuj później."
              : uploadBlad.message
          );
          return;
        }

        const {
          data: { publicUrl: urlSupa },
        } = supabase.storage.from("hall_inventory").getPublicUrl(sciezka);
        publicUrl = urlSupa;
      }

      const wynik = await ustawZdjecieWyposazeniaSwietlicy({
        hallId,
        pozycjaId,
        image_url: publicUrl,
      });
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      router.refresh();
    } catch {
      ustawBlad("Nie udało się wgrać pliku.");
    } finally {
      ustawLaduje(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onUsunZdjecie() {
    ustawBlad("");
    ustawLaduje(true);
    try {
      const wynik = await ustawZdjecieWyposazeniaSwietlicy({
        hallId,
        pozycjaId,
        image_url: null,
      });
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      router.refresh();
    } finally {
      ustawLaduje(false);
    }
  }

  return (
    <div className="mt-3 border-t border-stone-100 pt-3">
      <span className="text-xs font-medium text-stone-600">Zdjęcie pozycji</span>
      <div className="mt-2 flex flex-wrap items-start gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL z Supabase Storage
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">brak</div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={laduje}
            onChange={(e) => void onWyborPliku(e.target.files?.[0] ?? null)}
            className="max-w-full text-xs text-stone-600 file:mr-2 file:rounded file:border-0 file:bg-stone-200 file:px-2 file:py-1 file:text-xs file:font-medium hover:file:bg-stone-300"
          />
          {imageUrl ? (
            <button
              type="button"
              disabled={laduje}
              onClick={() => void onUsunZdjecie()}
              className="self-start text-xs text-red-800 underline disabled:opacity-50"
            >
              Usuń zdjęcie z karty
            </button>
          ) : null}
          {blad ? (
            <p className="text-xs text-red-800" role="alert">
              {blad}
            </p>
          ) : null}
          <p className="text-[11px] text-stone-500">JPEG / PNG / WebP, do 3 MB.</p>
        </div>
      </div>
    </div>
  );
}
