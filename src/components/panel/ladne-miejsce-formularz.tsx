"use client";

import { FormEvent, useState, useTransition } from "react";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";
import { dodajLadneMiejsceNaMapie } from "@/app/(site)/panel/soltys/akcje-poi-miejsca";
import { WyborPunktuMapyKlient } from "@/components/zgloszenia/wybor-punktu-mapy-klient";

type Props = {
  villageId: string;
  domyslnaLat?: number | null;
  domyslnaLng?: number | null;
};

export function LadneMiejsceFormularz({ villageId, domyslnaLat, domyslnaLng }: Props) {
  const [lat, ustawLat] = useState<number | null>(domyslnaLat ?? null);
  const [lng, ustawLng] = useState<number | null>(domyslnaLng ?? null);
  const [blad, ustawBlad] = useState("");
  const [ok, ustawOk] = useState(false);
  const [czek, startT] = useTransition();

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    ustawOk(false);
    if (lat == null || lng == null) {
      ustawBlad("Zaznacz punkt na mapie (współrzędne GPS).");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const plik = fd.get("photo");
    if (!(plik instanceof File) || plik.size < 1) {
      ustawBlad("Dodaj jedno zdjęcie miejsca.");
      return;
    }
    if (plik.size > 5 * 1024 * 1024) {
      ustawBlad("Zdjęcie max 5 MB.");
      return;
    }

    startT(async () => {
      const supabase = utworzKlientaSupabasePrzegladarka();
      const ext = plik.name.split(".").pop()?.toLowerCase() || "jpg";
      const sciezka = `${villageId}/poi/${crypto.randomUUID()}.${ext}`;
      const { error: uE } = await supabase.storage.from("village_photos").upload(sciezka, plik, {
        upsert: false,
        contentType: plik.type || "image/jpeg",
      });
      if (uE) {
        ustawBlad("Nie udało się wgrać zdjęcia.");
        return;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("village_photos").getPublicUrl(sciezka);

      const w = await dodajLadneMiejsceNaMapie({
        villageId,
        name: String(fd.get("name")),
        description: String(fd.get("description") || "").trim() || null,
        photoCaption: String(fd.get("photo_caption") || "").trim() || null,
        latitude: lat,
        longitude: lng,
        photoUrl: publicUrl,
        photoPath: sciezka,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawOk(true);
      e.currentTarget.reset();
      ustawLat(domyslnaLat ?? null);
      ustawLng(domyslnaLng ?? null);
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3 rounded-xl border border-amber-200/80 bg-amber-50/40 p-4">
      <p className="text-sm font-medium text-amber-950">Dodaj ładne miejsce (1 zdjęcie + pinezka)</p>
      {ok ? <p className="text-sm text-green-900">Dodano — widać na mapie w kategorii „Ładne miejsce”.</p> : null}
      {blad ? <p className="text-sm text-red-800">{blad}</p> : null}
      <label className="block text-sm">
        Nazwa
        <input name="name" required maxLength={120} className="form-control mt-1" placeholder="np. Punkt widokowy nad stawem" />
      </label>
      <label className="block text-sm">
        Opis
        <textarea name="description" rows={2} maxLength={1200} className="form-control mt-1" placeholder="Krótko: co warto zobaczyć…" />
      </label>
      <label className="block text-sm">
        Podpis pod zdjęciem
        <input name="photo_caption" maxLength={300} className="form-control mt-1" placeholder="np. Jesienią szczególnie piękne" />
      </label>
      <label className="block text-sm">
        Zdjęcie (jedno)
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" required className="mt-1 block w-full text-sm" />
      </label>
      <WyborPunktuMapyKlient
        domyslnaLat={domyslnaLat}
        domyslnaLng={domyslnaLng}
        onChange={(la, ln) => {
          ustawLat(la);
          ustawLng(ln);
        }}
      />
      <p className="text-xs text-stone-500">
        Włącz GPS punktu — możesz skopiować współrzędne z telefonu na miejscu lub z mapy publicznej.
      </p>
      <button type="submit" disabled={czek} className="btn-panel-primary text-sm">
        Opublikuj na mapie
      </button>
    </form>
  );
}
