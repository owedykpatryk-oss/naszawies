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
import { InformacjaPrawnaNieruchomosci } from "@/components/marketplace/informacja-prawna-nieruchomosci";
import {
  MarketplaceFormularzDzialka,
  type WartosciDzialkiRynek,
} from "@/components/marketplace/marketplace-formularz-dzialka";
import { WyborKategoriiRynku } from "@/components/marketplace/wybor-kategorii-rynku";
import { czyKategoriaNieruchomosci, limitZdjecRynek } from "@/lib/marketplace/nieruchomosci";
import { czyKlientUzywaMagazynuR2 } from "@/lib/storage/czy-magazyn-r2";
import { wgrajObrazDoMagazynuR2 } from "@/lib/storage/wgraj-obraz-r2";
import { utworzKlientaSupabasePrzegladarka } from "@/lib/supabase/przegladarka";
import { dodajOgloszenieMarketplaceMieszkanca, edytujOgloszenieMarketplaceMieszkanca } from "./akcje";
import { MarketplaceFormularzRozszerzenia,
  type PoiOpcja,
  type WartosciRozszerzone,
} from "./marketplace-formularz-rozszerzenia";
import { MarketplaceChecklistaJakosci } from "@/components/marketplace/marketplace-checklista-jakosci";
import { RynekInfoKontaktMiedzyLudzmi } from "@/components/wies/rynek-info-kontakt-miedzy-ludzmi";
import { PrzyciskLadowania } from "@/components/ui/przycisk-ladowania";
import { PasekAkcjiMobilny } from "@/components/ui/pasek-akcji-mobilny";
import { wskazowkiKategorii } from "@/lib/marketplace/jakosc-ogloszenia";

type WiesOpcja = { id: string; name: string };
export type MetaWsiFormularz = {
  latitude: number | null;
  longitude: number | null;
  boundaryGeojson?: unknown | null;
};

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
  dzialka?: WartosciDzialkiRynek;
};

const MAX_BAJTOW = 4 * 1024 * 1024;
const MIME = ["image/jpeg", "image/png", "image/webp"] as const;

const domyslneDzialka = (): WartosciDzialkiRynek => ({
  parcelGeojson: null,
  parcelNumber: "",
  cadastralDistrict: "",
  parcelAreaM2: null,
  geoportalParcelId: "",
});

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
  metaWsi = {},
  edycja,
  pois = [],
}: {
  wsie: WiesOpcja[];
  metaWsi?: Record<string, MetaWsiFormularz>;
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
  const [dzialka, ustawDzialka] = useState<WartosciDzialkiRynek>(edycja?.dzialka ?? domyslneDzialka());
  const [telefon, ustawTelefon] = useState(edycja?.phone ?? "");
  const [miejsce, ustawMiejsce] = useState(edycja?.locationText ?? "");
  const [cena, ustawCena] = useState(edycja?.priceAmount != null ? String(edycja.priceAmount) : "");
  const [villageWybrana, ustawVillageWybrana] = useState(edycja?.villageId ?? wsie[0]?.id ?? "");
  const poisWsi = pois.filter((p) => p.village_id === villageWybrana);
  const maxZdjec = limitZdjecRynek(kat);
  const pokazDzialke = czyKategoriaNieruchomosci(kat);
  const metaAktywnej = metaWsi[villageWybrana];
  const srodekLat = metaAktywnej?.latitude ?? rozszerzone.latitude ?? 52.1;
  const srodekLng = metaAktywnej?.longitude ?? rozszerzone.longitude ?? 19.4;

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

    if (istniejaceZdjecia.length + pliki.length > maxZdjec) {
      ustawBlad(`Maksymalnie ${maxZdjec} zdjęcia łącznie.`);
      return;
    }
    for (const f of pliki) {
      if (!MIME.includes(f.type as (typeof MIME)[number]) || f.size > MAX_BAJTOW) {
        ustawBlad("Zdjęcia: JPEG, PNG, WebP, max 4 MB każde.");
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
          const plik = pliki[i]!;
          if (czyKlientUzywaMagazynuR2()) {
            const fd = new FormData();
            fd.append("typ", "marketplace");
            fd.append("villageId", villageId);
            fd.append("file", plik);
            const w = await wgrajObrazDoMagazynuR2(fd);
            if (!("ok" in w && w.ok)) {
              ustawBlad("blad" in w ? w.blad : "Upload R2 nieudany.");
              return;
            }
            imageUrlsNowe.push(w.publicUrl);
          } else {
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
        ...(pokazDzialke
          ? {
              parcelGeojson: dzialka.parcelGeojson,
              parcelNumber: dzialka.parcelNumber || null,
              cadastralDistrict: dzialka.cadastralDistrict || null,
              parcelAreaM2: dzialka.parcelAreaM2,
              geoportalParcelId: dzialka.geoportalParcelId || null,
            }
          : {
              parcelGeojson: null,
              parcelNumber: null,
              cadastralDistrict: null,
              parcelAreaM2: null,
              geoportalParcelId: null,
            }),
      };

      const w = edycja
        ? await edytujOgloszenieMarketplaceMieszkanca({ ...payload, listingId: edycja.id })
        : await dodajOgloszenieMarketplaceMieszkanca(payload);
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
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_minmax(260px,320px)] lg:items-start">
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-orange-200/80 bg-gradient-to-br from-orange-50/40 via-white to-stone-50 p-5 shadow-sm">
      <p className="text-sm text-stone-700">
        <strong>Darmowe ogłoszenia</strong> — produkty z gospodarstwa, maszyny, konie,{" "}
        <strong>działki i domy z mapą Geoportalu</strong>. Max {maxZdjec} zdjęć
        {pokazDzialke ? " (nieruchomości)" : ""}.
        {czyKlientUzywaMagazynuR2() ? (
          <>
            {" "}
            Zdjęcia zapisywane w <strong>Cloudflare R2</strong> (taniej niż Supabase Storage).
          </>
        ) : null}
        {edycja
          ? " Po zapisie opublikowane ogłoszenie wraca do akceptacji sołtysa."
          : " Po zatwierdzeniu przez sołtysa widoczne na profilu wsi przez 2 tygodnie — potem wygasa i trzeba je aktywować ponownie."}
      </p>
      <RynekInfoKontaktMiedzyLudzmi />
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
            Kategoria (jedzenie, maszyny, działki, usługi)
          </label>
          <WyborKategoriiRynku
            id="mk-kat"
            value={kat}
            onChange={(v) => {
              ustawKat(v);
              const dom = domyslnaJednostkaCeny(v);
              if (dom) ustawJednostkaCeny(dom);
              if (!czyKategoriaNieruchomosci(v)) ustawDzialka(domyslneDzialka());
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
          {kat ? (
            <p className="mt-1 text-xs text-amber-900/80">💡 {wskazowkiKategorii(kat).tytul}</p>
          ) : null}
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
            placeholder={kat ? wskazowkiKategorii(kat).opis : "Stan, rok, dostępność, warunki wynajmu…"}
          />
          {opis.trim().length > 0 && opis.trim().length < 80 ? (
            <p className="mt-1 text-xs text-amber-800">Jeszcze {80 - opis.trim().length} znaków do „dobrej jakości” w wyszukiwarce.</p>
          ) : null}
        </div>
        <div>
          <label className="mb-1 block text-sm" htmlFor="mk-cena">
            Cena (PLN, opcjonalnie)
          </label>
          <input
            id="mk-cena"
            name="price_amount"
            inputMode="decimal"
            value={cena}
            onChange={(e) => ustawCena(e.target.value)}
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
            value={telefon}
            onChange={(e) => ustawTelefon(e.target.value)}
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
            value={miejsce}
            onChange={(e) => ustawMiejsce(e.target.value)}
          />
        </div>
        <p className="sm:col-span-2 text-xs text-stone-600">
          Każde ogłoszenie jest widoczne <strong>2 tygodnie</strong>. Po tym czasie znika z rynku — możesz je ponownie
          aktywować w liście „Twoje ogłoszenia” (kolejne 2 tygodnie).
        </p>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium" htmlFor="mk-foto">
            Zdjęcia (opcjonalnie, max {maxZdjec})
          </label>
          <input
            id="mk-foto"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => {
              const l = e.target.files ? Array.from(e.target.files) : [];
              ustawPliki(l.slice(0, Math.max(0, maxZdjec - istniejaceZdjecia.length)));
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
              Nowe zdjęcia: {pliki.length} (łącznie {istniejaceZdjecia.length + pliki.length}/{maxZdjec})
            </p>
          ) : null}
        </div>
      </div>

      {pokazDzialke ? (
        <MarketplaceFormularzDzialka
          srodekLat={srodekLat}
          srodekLng={srodekLng}
          boundaryGeojson={metaAktywnej?.boundaryGeojson}
          wartosci={dzialka}
          onChange={ustawDzialka}
          onCentroid={(lat, lng) => ustawRozszerzone((r) => ({ ...r, latitude: lat, longitude: lng }))}
        />
      ) : null}

      {!pokazDzialke ? (
        <MarketplaceFormularzRozszerzenia
          kat={kat}
          pois={poisWsi}
          wartosci={rozszerzone}
          onChange={ustawRozszerzone}
          punktOdniesieniaWsi={
            metaAktywnej?.latitude != null && metaAktywnej?.longitude != null
              ? { lat: metaAktywnej.latitude, lng: metaAktywnej.longitude }
              : null
          }
        />
      ) : (
        <div className="rounded-lg border border-stone-200 bg-stone-50/50 p-3 text-sm">
          <p className="font-medium text-stone-800">Kontakt</p>
          <p className="mt-1 text-xs text-stone-600">Telefon i miejsce uzupełnij powyżej. GPS ustawia się z mapy działki.</p>
        </div>
      )}

      {pokazDzialke ? <InformacjaPrawnaNieruchomosci /> : <InformacjaPrawnaRol />}

      <PasekAkcjiMobilny>
        <PrzyciskLadowania
          type="submit"
          laduje={czek}
          tekst={edycja ? "Zapisz zmiany" : "Opublikuj (do akceptacji sołtysa)"}
          tekstLadowania="Wysyłanie…"
          className="w-full sm:w-auto"
        />
      </PasekAkcjiMobilny>
    </form>

    <MarketplaceChecklistaJakosci
      kategoria={kat}
      tytul={tytul}
      opis={opis}
      cena={cena.trim() ? Number.parseFloat(cena.replace(",", ".")) : null}
      jednostkaCeny={jednostkaCeny}
      telefon={telefon}
      miejsce={miejsce}
      liczbaZdjec={istniejaceZdjecia.length + pliki.length}
      zOperatorem={zOperatorem}
      geoportalParcelId={dzialka.geoportalParcelId}
      parcelAreaM2={dzialka.parcelAreaM2}
      parcelNumber={dzialka.parcelNumber}
      pickupInVillage={rozszerzone.pickupInVillage}
      deliveryRadiusKm={rozszerzone.deliveryRadiusKm}
      seasonalNote={rozszerzone.seasonalNote}
      productProducedAt={rozszerzone.productProducedAt}
      isOrganic={rozszerzone.isOrganic}
      latitude={rozszerzone.latitude}
      onUzupelnijOpis={(tekst) => ustawOpis((prev) => (prev.trim().length < 10 ? tekst : prev))}
    />
    </div>
  );
}
