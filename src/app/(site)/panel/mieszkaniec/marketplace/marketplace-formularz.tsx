"use client";

import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  JEDNOSTKI_CENY,
  TYPY_OGLOSZEN,
  domyslnaJednostkaCeny,
  podpowiedzTytulu,
} from "@/lib/marketplace/kategorie-ogloszen";
import { InformacjaPrawnaRol } from "@/components/marketplace/informacja-prawna-rol";
import { WyborKategoriiRynku } from "@/components/marketplace/wybor-kategorii-rynku";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";
import { dodajOgloszenieMarketplaceMieszkanca, edytujOgloszenieMarketplaceMieszkanca } from "./akcje";
import {
  MarketplaceFormularzRozszerzenia,
  type PoiOpcja,
  type WartosciRozszerzone,
} from "./marketplace-formularz-rozszerzenia";

type WiesOpcja = { id: string; name: string };

export type EdycjaOgloszeniaPoczatek = {
  id: string;
  villageId: string;
  listingType: string;
  title: string;
  description: string;
  equipmentCategory: string | null;
  priceAmount: number | null;
  priceUnit: string | null;
  withOperator: boolean;
  phone: string | null;
  locationText: string | null;
  imageUrls: string[];
  rozszerzone?: WartosciRozszerzone;
};

const MAX_ZDJEC = 3;
const MAX_BAJTOW = 3 * 1024 * 1024;
const MIME = ["image/jpeg", "image/png", "image/webp"] as const;

const domyslneRozszerzone = (): WartosciRozszerzone => ({
  latitude: null,
  longitude: null,
  pickupInVillage: false,
  deliveryRadiusKm: null,
  seasonalNote: "",
  productProducedAt: "",
  productBestBefore: "",
  isOrganic: false,
  allergensText: "",
  salesPoiId: null,
});

export function MarketplaceFormularzMieszkanca({
  wsie,
  edycja,
  pois = [],
}: {
  wsie: WiesOpcja[];
  edycja?: EdycjaOgloszeniaPoczatek;
  pois?: PoiOpcja[];
}) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();
  const [typ, ustawTyp] = useState<string>(edycja?.listingType ?? "sprzedam");
  const [kat, ustawKat] = useState(edycja?.equipmentCategory ?? "");
  const [zOperatorem, ustawZOperatorem] = useState(edycja?.withOperator ?? false);
  const [tytul, ustawTytul] = useState(edycja?.title ?? "");
  const [opis, ustawOpis] = useState(edycja?.description ?? "");
  const [istniejaceZdjecia, ustawIstniejaceZdjecia] = useState<string[]>(edycja?.imageUrls ?? []);
  const [pliki, ustawPliki] = useState<File[]>([]);
  const [jednostkaCeny, ustawJednostkaCeny] = useState(
    edycja?.priceUnit ?? domyslnaJednostkaCeny(edycja?.equipmentCategory ?? ""),
  );
  const [rozszerzone, ustawRozszerzone] = useState<WartosciRozszerzone>(
    edycja?.rozszerzone ?? domyslneRozszerzone(),
  );
  const [villageWybrana, ustawVillageWybrana] = useState(edycja?.villageId ?? wsie[0]?.id ?? "");
  const poisWsi = pois.filter((p) => p.village_id === villageWybrana);

  const podpowiedz = useMemo(() => podpowiedzTytulu(typ, kat, zOperatorem), [typ, kat, zOperatorem]);

  useEffect(() => {
    if (!edycja && !tytul && podpowiedz) ustawTytul(podpowiedz);
  }, [podpowiedz, tytul, edycja]);

  if (wsie.length === 0) {
    return <p className="text-sm text-stone-600">Dołącz do wsi, aby dodać darmowe ogłoszenie.</p>;
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    const fd = new FormData(e.currentTarget);
    const villageId = String(fd.get("village_id"));
    const cena = String(fd.get("price_amount") || "").trim();

    if (istniejaceZdjecia.length + pliki.length > MAX_ZDJEC) {
      ustawBlad(`Maksymalnie ${MAX_ZDJEC} zdjęcia łącznie.`);
      return;
    }
    for (const f of pliki) {
      if (!MIME.includes(f.type as (typeof MIME)[number]) || f.size > MAX_BAJTOW) {
        ustawBlad("Zdjęcia: JPEG, PNG, WebP, max 3 MB każde.");
        return;
      }
    }

    startT(async () => {
      const imageUrlsNowe: string[] = [];
      if (pliki.length > 0) {
        const supabase = utworzKlientaSupabasePrzegladarka();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          ustawBlad("Zaloguj się ponownie.");
          return;
        }
        for (let i = 0; i < pliki.length; i++) {
          const plik = pliki[i];
          const ext = plik.type === "image/png" ? "png" : plik.type === "image/webp" ? "webp" : "jpg";
          const sciezka = `${villageId}/${user.id}/${Date.now()}-${i}.${ext}`;
          const { error: uE } = await supabase.storage.from("village_marketplace").upload(sciezka, plik, {
            contentType: plik.type,
            upsert: false,
          });
          if (uE) {
            ustawBlad(uE.message.includes("Bucket") ? "Upload zdjęć chwilowo niedostępny." : uE.message);
            return;
          }
          const {
            data: { publicUrl },
          } = supabase.storage.from("village_marketplace").getPublicUrl(sciezka);
          imageUrlsNowe.push(publicUrl);
        }
      }

      const imageUrls = [...istniejaceZdjecia, ...imageUrlsNowe];
      const payload = {
        villageId: edycja?.villageId ?? villageId,
        listingType: typ as "sprzedam",
        title: tytul.trim() || String(fd.get("title")),
        description: opis.trim() || String(fd.get("description")),
        equipmentCategory: kat || null,
        priceAmount: cena ? Number(cena.replace(",", ".")) : null,
        priceUnit: String(fd.get("price_unit") || "") || null,
        withOperator: zOperatorem,
        phone: String(fd.get("phone") || "") || null,
        locationText: String(fd.get("location_text") || "") || null,
        imageUrls,
        ...rozszerzone,
      };

      const w = edycja
        ? await edytujOgloszenieMarketplaceMieszkanca({ ...payload, listingId: edycja.id })
        : await dodajOgloszenieMarketplaceMieszkanca({
            ...payload,
            dniWaznosci: Number(fd.get("dni_waznosci") || 30),
          });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      ustawPliki([]);
      router.refresh();
      router.push("/panel/mieszkaniec/marketplace");
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-5 rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50/40 via-white to-stone-50 p-5 shadow-sm">
      <p className="text-sm text-stone-700">
        <strong>Darmowe ogłoszenia</strong> — produkty z gospodarstwa (miód, sery, mięso, warzywa), maszyny rolnicze,
        konie, wynajem z operatorem. Max {MAX_ZDJEC} zdjęcia.
        {edycja
          ? " Po zapisie opublikowane ogłoszenie wraca do akceptacji sołtysa."
          : " Po zatwierdzeniu przez sołtysa widoczne na profilu wsi."}
      </p>
      {blad ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="mk-wies">
            Wieś
          </label>
          <select
            id="mk-wies"
            name="village_id"
            required
            value={villageWybrana}
            onChange={(e) => ustawVillageWybrana(e.target.value)}
            disabled={!!edycja}
          >
            {wsie.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="mk-typ">
            Co chcesz zrobić?
          </label>
          <select
            id="mk-typ"
            name="listing_type"
            value={typ}
            onChange={(e) => ustawTyp(e.target.value)}
            className="w-full"
          >
            {TYPY_OGLOSZEN.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium" htmlFor="mk-kat">
            Kategoria (jedzenie, maszyny, zwierzęta, usługi)
          </label>
          <WyborKategoriiRynku
            id="mk-kat"
            value={kat}
            onChange={(v) => {
              ustawKat(v);
              const dom = domyslnaJednostkaCeny(v);
              if (dom) ustawJednostkaCeny(dom);
            }}
            wymagane
          />
        </div>
        {(typ === "wynajme" || typ === "usluga") && (
          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={zOperatorem}
                onChange={(e) => ustawZOperatorem(e.target.checked)}
                className="accent-green-800"
              />
              Z operatorem (np. usługa za godzinę z obsługą maszyny)
            </label>
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium" htmlFor="mk-tyt">
            Tytuł ogłoszenia
          </label>
          <input
            id="mk-tyt"
            name="title"
            required
            minLength={3}
            maxLength={120}
            value={tytul}
            onChange={(e) => ustawTytul(e.target.value)}
            placeholder={podpowiedz || "np. Sprzedam ciągnik Ursus — dobry stan"}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium" htmlFor="mk-opis">
            Opis
          </label>
          <textarea
            id="mk-opis"
            name="description"
            required
            minLength={10}
            rows={5}
            value={opis}
            onChange={(e) => ustawOpis(e.target.value)}
            placeholder="Stan, rok, dostępność, warunki wynajmu…"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="mk-cena">
            Cena (PLN, opcjonalnie)
          </label>
          <input
            id="mk-cena"
            name="price_amount"
            inputMode="decimal"
            defaultValue={edycja?.priceAmount ?? undefined}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="mk-jedn">
            Jednostka ceny
          </label>
          <select
            id="mk-jedn"
            name="price_unit"
            value={jednostkaCeny}
            onChange={(e) => ustawJednostkaCeny(e.target.value)}
          >
            {JEDNOSTKI_CENY.map((j) => (
              <option key={j.value || "x"} value={j.value}>
                {j.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="mk-tel">
            Telefon (opcjonalnie)
          </label>
          <input
            id="mk-tel"
            name="phone"
            maxLength={30}
            placeholder="+48 …"
            defaultValue={edycja?.phone ?? ""}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="mk-miejsce">
            Miejsce / rejon
          </label>
          <input
            id="mk-miejsce"
            name="location_text"
            maxLength={200}
            defaultValue={edycja?.locationText ?? ""}
          />
        </div>
        {!edycja ? (
          <div>
            <label className="mb-1 block text-sm" htmlFor="mk-dni">
              Ogłoszenie ważne (dni)
            </label>
            <input id="mk-dni" name="dni_waznosci" type="number" min={7} max={90} defaultValue={30} />
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium" htmlFor="mk-foto">
            Zdjęcia (opcjonalnie, max {MAX_ZDJEC})
          </label>
          <input
            id="mk-foto"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => {
              const l = e.target.files ? Array.from(e.target.files) : [];
              ustawPliki(l.slice(0, MAX_ZDJEC));
            }}
          />
          {istniejaceZdjecia.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {istniejaceZdjecia.map((url) => (
                <div key={url} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-16 w-16 rounded-lg border object-cover" />
                  <button
                    type="button"
                    className="absolute -right-1 -top-1 rounded-full bg-red-700 px-1.5 text-[10px] text-white"
                    onClick={() => ustawIstniejaceZdjecia((prev) => prev.filter((u) => u !== url))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          {pliki.length > 0 ? (
            <p className="mt-1 text-xs text-stone-500">
              Nowe zdjęcia: {pliki.length} (łącznie {istniejaceZdjecia.length + pliki.length}/{MAX_ZDJEC})
            </p>
          ) : null}
        </div>
      </div>

      <MarketplaceFormularzRozszerzenia kat={kat} pois={poisWsi} wartosci={rozszerzone} onChange={ustawRozszerzone} />

      <InformacjaPrawnaRol />

      <button
        type="submit"
        disabled={czek}
        className="w-full rounded-xl bg-green-800 px-4 py-3 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50 sm:w-auto"
      >
        {czek ? "Wysyłanie…" : edycja ? "Zapisz zmiany" : "Opublikuj (do akceptacji sołtysa)"}
      </button>
    </form>
  );
}
