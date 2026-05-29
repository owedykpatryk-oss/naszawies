"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GRUPY_KATEGORII_RYNKU,
  TYPY_OGLOSZEN,
  czyKategoriaProduktuLokalnego,
  etykietaKategoriiOgloszenia,
  etykietaTypuOgloszenia,
} from "@/lib/marketplace/kategorie-ogloszen";
import { czyKategoriaNieruchomosci } from "@/lib/marketplace/nieruchomosci";
import { obliczJakoscZOfertyPublicznej } from "@/lib/marketplace/jakosc-ogloszenia";
import type { ZaufanieSprzedawcy } from "@/lib/marketplace/zaufanie-sprzedawcy";
import { filtryRynkuZUrl, urlZFiltramiRynku } from "@/lib/marketplace/filtry-url";
import { RynekSubskrypcjaKategorii } from "@/components/wies/rynek-subskrypcja-kategorii";
import {
  KartaOgloszeniaRynek,
  PasekAkcjiRynku,
} from "@/components/wies/rynek-ui";

export type RynekOfertaPubliczna = {
  id: string;
  title: string;
  listing_type: string;
  category: string | null;
  equipment_category?: string | null;
  location_text: string | null;
  price_amount: number | null;
  price_unit?: string | null;
  currency: string | null;
  with_operator?: boolean | null;
  seller_verified?: boolean | null;
  image_urls?: string[] | null;
  published_at: string | null;
  created_at: string;
  parcel_area_m2?: number | null;
  parcel_number?: string | null;
  geoportal_parcel_id?: string | null;
  view_count?: number;
  owner_user_id?: string | null;
} & ZaufanieSprzedawcy;

const opcjeTypu = [{ value: "wszystkie", label: "Wszystkie typy" }, ...TYPY_OGLOSZEN.map((t) => ({ value: t.value, label: t.label }))];

const SZYBKIE_KATEGORIE = [
  { value: "miod", label: "Miód", emoji: "🍯" },
  { value: "sery_nabial", label: "Sery", emoji: "🧀" },
  { value: "warzywa_owoce", label: "Warzywa", emoji: "🥕" },
  { value: "ciagnik", label: "Ciągnik", emoji: "🚜" },
  { value: "usluga_z_operatorem", label: "Z operatorem", emoji: "👷" },
  { value: "dzialka_budowlana", label: "Działki", emoji: "📐" },
] as const;

function liczbaAktywnychFiltrow(st: {
  fraza: string;
  typ: string;
  kategoria: string;
  tylkoZOperatorem: boolean;
  tylkoProduktyLokalne: boolean;
  tylkoZweryfikowane: boolean;
  tylkoNieruchomosci: boolean;
  tylkoZMapaGeoportal: boolean;
  minM2: string;
  maxM2: string;
  minCena: string;
  maxCena: string;
}) {
  let n = 0;
  if (st.fraza.trim()) n++;
  if (st.typ !== "wszystkie") n++;
  if (st.kategoria !== "wszystkie") n++;
  if (st.tylkoZOperatorem) n++;
  if (st.tylkoProduktyLokalne) n++;
  if (st.tylkoZweryfikowane) n++;
  if (st.tylkoNieruchomosci) n++;
  if (st.tylkoZMapaGeoportal) n++;
  if (st.minM2.trim()) n++;
  if (st.maxM2.trim()) n++;
  if (st.minCena.trim()) n++;
  if (st.maxCena.trim()) n++;
  return n;
}

function parsujLiczbe(input: string): number | null {
  const n = Number.parseFloat(input.replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

function ChipFiltru({ etykieta, onUsun }: { etykieta: string; onUsun: () => void }) {
  return (
    <button
      type="button"
      onClick={onUsun}
      className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-700 transition hover:bg-stone-200"
      title="Usuń filtr"
    >
      {etykieta}
      <span aria-hidden className="text-stone-400">
        ×
      </span>
    </button>
  );
}

function useDebounced<T>(wartosc: T, opoznienieMs: number): T {
  const [debounced, ustawDebounced] = useState(wartosc);
  useEffect(() => {
    const t = window.setTimeout(() => ustawDebounced(wartosc), opoznienieMs);
    return () => window.clearTimeout(t);
  }, [wartosc, opoznienieMs]);
  return debounced;
}

export function MarketplaceListaKlient({
  oferty,
  sciezkaWsi,
  villageId,
  kotwicaZasadSwietlicy,
  pokazLinkWszystkie = true,
  limitWyswietlania,
  tryb,
  zalogowany = false,
  nazwaWsi,
  subskrybowaneKategorie = [],
  ukryjPasekAkcji = false,
  kotwicaMapyRynek,
}: {
  oferty: RynekOfertaPubliczna[];
  sciezkaWsi: string;
  villageId?: string;
  kotwicaZasadSwietlicy?: string;
  /** Gdy false — jesteś już na stronie pełnej listy. */
  pokazLinkWszystkie?: boolean;
  limitWyswietlania?: number;
  /** skrot — na profilu wsi; pelny — strona /rynek z siatką kart */
  tryb?: "skrot" | "pelny";
  zalogowany?: boolean;
  nazwaWsi?: string;
  /** equipment_category z subskrypcji użytkownika (null = wszystkie) */
  subskrybowaneKategorie?: (string | null)[];
  /** Na profilu wsi — hero ma już CTA, nie duplikuj paska akcji. */
  ukryjPasekAkcji?: boolean;
  /** Link do mapy inline na stronie /rynek (np. #rynek-mapa). */
  kotwicaMapyRynek?: string;
}) {
  const uklad = tryb ?? (pokazLinkWszystkie ? "skrot" : "pelny");
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlZainicjowany = useRef(false);

  const [fraza, setFraza] = useState("");
  const [typ, setTyp] = useState("wszystkie");
  const [kategoria, setKategoria] = useState("wszystkie");
  const [tylkoZOperatorem, setTylkoZOperatorem] = useState(false);
  const [tylkoProduktyLokalne, setTylkoProduktyLokalne] = useState(false);
  const [sortowanie, setSortowanie] = useState<"najnowsze" | "najstarsze" | "polecane">("najnowsze");
  const [tylkoZweryfikowane, setTylkoZweryfikowane] = useState(false);
  const [tylkoNieruchomosci, setTylkoNieruchomosci] = useState(false);
  const [tylkoZMapaGeoportal, setTylkoZMapaGeoportal] = useState(false);
  const [minM2, setMinM2] = useState("");
  const [maxM2, setMaxM2] = useState("");
  const [minCena, setMinCena] = useState("");
  const [maxCena, setMaxCena] = useState("");
  const [widok, setWidok] = useState<"siatka" | "lista">("siatka");
  const [filtryOtwarte, setFiltryOtwarte] = useState(false);
  const [kopiujFiltr, ustawKopiujFiltr] = useState<"idle" | "ok">("idle");
  const frazaDoUrl = useDebounced(fraza, 300);

  useEffect(() => {
    if (uklad !== "pelny" || urlZainicjowany.current) return;
    urlZainicjowany.current = true;
    const f = filtryRynkuZUrl(searchParams);
    setFraza(f.fraza);
    setTyp(f.typ);
    setKategoria(f.kategoria);
    setSortowanie(f.sortowanie);
    setTylkoZOperatorem(f.tylkoZOperatorem);
    setTylkoProduktyLokalne(f.tylkoProduktyLokalne);
    setTylkoZweryfikowane(f.tylkoZweryfikowane);
    setTylkoNieruchomosci(f.tylkoNieruchomosci);
    setTylkoZMapaGeoportal(f.tylkoZMapaGeoportal);
    setMinM2(f.minM2);
    setMaxM2(f.maxM2);
    setMinCena(f.minCena);
    setMaxCena(f.maxCena);
    setWidok(f.widok);
    if ([f.fraza, f.typ, f.kategoria, f.minM2, f.maxM2, f.minCena, f.maxCena].some(Boolean) || f.tylkoZOperatorem || f.tylkoProduktyLokalne || f.tylkoZweryfikowane || f.tylkoNieruchomosci || f.tylkoZMapaGeoportal) {
      setFiltryOtwarte(true);
    }
  }, [uklad, searchParams]);

  useEffect(() => {
    if (uklad !== "pelny" || !urlZainicjowany.current) return;
    const qs = urlZFiltramiRynku({
      fraza: frazaDoUrl,
      typ,
      kategoria,
      sortowanie,
      tylkoZOperatorem,
      tylkoProduktyLokalne,
      tylkoZweryfikowane,
      tylkoNieruchomosci,
      tylkoZMapaGeoportal,
      minM2,
      maxM2,
      minCena,
      maxCena,
      widok,
    });
    router.replace(`${pathname}${qs}`, { scroll: false });
  }, [
    uklad,
    pathname,
    router,
    frazaDoUrl,
    typ,
    kategoria,
    sortowanie,
    tylkoZOperatorem,
    tylkoProduktyLokalne,
    tylkoZweryfikowane,
    tylkoNieruchomosci,
    tylkoZMapaGeoportal,
    minM2,
    maxM2,
    minCena,
    maxCena,
    widok,
  ]);

  const kopiujLinkFiltrów = useCallback(async () => {
    try {
      const qs = urlZFiltramiRynku({
        fraza,
        typ,
        kategoria,
        sortowanie,
        tylkoZOperatorem,
        tylkoProduktyLokalne,
        tylkoZweryfikowane,
        tylkoNieruchomosci,
        tylkoZMapaGeoportal,
        minM2,
        maxM2,
        minCena,
        maxCena,
        widok,
      });
      await navigator.clipboard.writeText(`${window.location.origin}${pathname}${qs}`);
      ustawKopiujFiltr("ok");
      window.setTimeout(() => ustawKopiujFiltr("idle"), 2000);
    } catch {
      /* ignore */
    }
  }, [
    fraza,
    typ,
    kategoria,
    sortowanie,
    tylkoZOperatorem,
    tylkoProduktyLokalne,
    tylkoZweryfikowane,
    tylkoNieruchomosci,
    tylkoZMapaGeoportal,
    minM2,
    maxM2,
    minCena,
    maxCena,
    widok,
    pathname,
  ]);

  const aktywneFiltry = liczbaAktywnychFiltrow({
    fraza,
    typ,
    kategoria,
    tylkoZOperatorem,
    tylkoProduktyLokalne,
    tylkoZweryfikowane,
    tylkoNieruchomosci,
    minM2,
    maxM2,
    minCena,
    maxCena,
    tylkoZMapaGeoportal,
  });

  const wyczyscFiltry = () => {
    setFraza("");
    setTyp("wszystkie");
    setKategoria("wszystkie");
    setTylkoZOperatorem(false);
    setTylkoProduktyLokalne(false);
    setTylkoZweryfikowane(false);
    setTylkoNieruchomosci(false);
    setTylkoZMapaGeoportal(false);
    setMinM2("");
    setMaxM2("");
    setMinCena("");
    setMaxCena("");
    setSortowanie("najnowsze");
  };

  const przefiltrowane = useMemo(() => {
    const q = fraza.trim().toLowerCase();
    const minPow = parsujLiczbe(minM2);
    const maxPow = parsujLiczbe(maxM2);
    const minKwota = parsujLiczbe(minCena);
    const maxKwota = parsujLiczbe(maxCena);
    let rows = oferty.filter((o) => {
      const kat = o.equipment_category ?? o.category ?? "";
      if (typ !== "wszystkie" && o.listing_type !== typ) return false;
      if (kategoria !== "wszystkie" && kat !== kategoria) return false;
      if (tylkoZOperatorem && !o.with_operator) return false;
      if (tylkoZweryfikowane && !o.seller_verified) return false;
      if (tylkoProduktyLokalne && !czyKategoriaProduktuLokalnego(kat)) return false;
      if (tylkoNieruchomosci && !czyKategoriaNieruchomosci(kat)) return false;
      if (tylkoZMapaGeoportal && !o.geoportal_parcel_id) return false;
      if (minPow != null && (o.parcel_area_m2 == null || o.parcel_area_m2 < minPow)) return false;
      if (maxPow != null && (o.parcel_area_m2 == null || o.parcel_area_m2 > maxPow)) return false;
      if (minKwota != null && (o.price_amount == null || o.price_amount < minKwota)) return false;
      if (maxKwota != null && (o.price_amount == null || o.price_amount > maxKwota)) return false;
      if (!q) return true;
      const haystack = [o.title, kat, o.location_text, o.listing_type, o.parcel_number].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
    rows = [...rows].sort((a, b) => {
      if (sortowanie === "polecane") {
        const va = a.seller_verified ? 1 : 0;
        const vb = b.seller_verified ? 1 : 0;
        if (vb !== va) return vb - va;
        const ja = obliczJakoscZOfertyPublicznej(a);
        const jb = obliczJakoscZOfertyPublicznej(b);
        if (jb !== ja) return jb - ja;
      }
      const ta = Date.parse(a.published_at ?? a.created_at) || 0;
      const tb = Date.parse(b.published_at ?? b.created_at) || 0;
      return sortowanie === "najstarsze" ? ta - tb : tb - ta;
    });
    if (limitWyswietlania != null) rows = rows.slice(0, limitWyswietlania);
    return rows;
  }, [fraza, oferty, typ, kategoria, tylkoZOperatorem, tylkoProduktyLokalne, tylkoZweryfikowane, tylkoNieruchomosci, tylkoZMapaGeoportal, minM2, maxM2, minCena, maxCena, sortowanie, limitWyswietlania]);

  const liczbaZMapaGeoportal = useMemo(
    () => oferty.filter((o) => Boolean(o.geoportal_parcel_id)).length,
    [oferty],
  );

  const hrefMapyRynek = uklad === "pelny" ? "#rynek-mapa" : undefined;

  const etykietaAktywnejKategorii =
    kategoria !== "wszystkie"
      ? SZYBKIE_KATEGORIE.find((s) => s.value === kategoria)?.label ??
        GRUPY_KATEGORII_RYNKU.flatMap((g) => g.items).find((i) => i.value === kategoria)?.label ??
        etykietaKategoriiOgloszenia(kategoria)
      : null;

  const kategoriaSubskrypcji =
    kategoria !== "wszystkie"
      ? kategoria
      : tylkoNieruchomosci
        ? "dzialka_budowlana"
        : tylkoZMapaGeoportal
          ? "dzialka_budowlana"
          : null;

  const chipyAktywnychFiltrow =
    aktywneFiltry > 0 ? (
      <div className="flex flex-wrap gap-1.5 border-t border-stone-100 px-3 py-2 sm:px-4">
        {fraza.trim() ? (
          <ChipFiltru etykieta={`„${fraza.trim()}”`} onUsun={() => setFraza("")} />
        ) : null}
        {typ !== "wszystkie" ? (
          <ChipFiltru etykieta={etykietaTypuOgloszenia(typ)} onUsun={() => setTyp("wszystkie")} />
        ) : null}
        {etykietaAktywnejKategorii ? (
          <ChipFiltru etykieta={etykietaAktywnejKategorii} onUsun={() => setKategoria("wszystkie")} />
        ) : null}
        {tylkoNieruchomosci ? (
          <ChipFiltru etykieta="Nieruchomości" onUsun={() => setTylkoNieruchomosci(false)} />
        ) : null}
        {tylkoZMapaGeoportal ? (
          <ChipFiltru etykieta="Geoportal" onUsun={() => setTylkoZMapaGeoportal(false)} />
        ) : null}
        {tylkoZOperatorem ? (
          <ChipFiltru etykieta="Z operatorem" onUsun={() => setTylkoZOperatorem(false)} />
        ) : null}
        {tylkoProduktyLokalne ? (
          <ChipFiltru etykieta="Z gospodarstwa" onUsun={() => setTylkoProduktyLokalne(false)} />
        ) : null}
        {tylkoZweryfikowane ? (
          <ChipFiltru etykieta="Zweryfikowani" onUsun={() => setTylkoZweryfikowane(false)} />
        ) : null}
        {minM2.trim() || maxM2.trim() ? (
          <ChipFiltru
            etykieta={`${minM2.trim() ? `≥ ${minM2} m²` : ""}${minM2.trim() && maxM2.trim() ? " · " : ""}${maxM2.trim() ? `≤ ${maxM2} m²` : ""}`}
            onUsun={() => {
              setMinM2("");
              setMaxM2("");
            }}
          />
        ) : null}
        {minCena.trim() || maxCena.trim() ? (
          <ChipFiltru
            etykieta={`${minCena.trim() ? `≥ ${minCena} PLN` : ""}${minCena.trim() && maxCena.trim() ? " · " : ""}${maxCena.trim() ? `≤ ${maxCena} PLN` : ""}`}
            onUsun={() => {
              setMinCena("");
              setMaxCena("");
            }}
          />
        ) : null}
      </div>
    ) : null;

  const chipyKategorii = (
    <div className="flex flex-wrap gap-2">
      {SZYBKIE_KATEGORIE.map((s) => {
        const aktywna = s.value === "dzialka_budowlana" ? tylkoNieruchomosci : kategoria === s.value;
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => {
              if (s.value === "dzialka_budowlana") {
                setTylkoNieruchomosci((v) => !v);
                return;
              }
              setKategoria(kategoria === s.value ? "wszystkie" : s.value);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
              aktywna
                ? "border-orange-400 bg-gradient-to-br from-orange-100 to-amber-50 text-orange-950 shadow-sm"
                : "border-stone-200/90 bg-white text-stone-700 hover:border-orange-200 hover:bg-orange-50/50"
            }`}
          >
            <span aria-hidden>{s.emoji}</span>
            {s.label}
          </button>
        );
      })}
      {liczbaZMapaGeoportal > 0 ? (
        <button
          type="button"
          onClick={() => setTylkoZMapaGeoportal((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
            tylkoZMapaGeoportal
              ? "border-amber-500 bg-gradient-to-br from-amber-100 to-yellow-50 text-amber-950 shadow-sm"
              : "border-stone-200/90 bg-white text-stone-700 hover:border-amber-300 hover:bg-amber-50/50"
          }`}
        >
          <span aria-hidden>📐</span>
          Geoportal
          <span className="rounded-full bg-amber-200/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">
            {liczbaZMapaGeoportal}
          </span>
        </button>
      ) : null}
    </div>
  );

  if (uklad === "skrot") {
    return (
      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {SZYBKIE_KATEGORIE.slice(0, 4).map((s) => (
            <Link
              key={s.value}
              href={`${sciezkaWsi}/rynek${
                s.value === "dzialka_budowlana" ? "?nieruch=1" : `?kat=${encodeURIComponent(s.value)}`
              }`}
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50/50"
            >
              <span aria-hidden>{s.emoji}</span>
              {s.label}
            </Link>
          ))}
        </div>
        {przefiltrowane.length === 0 ? (
          <p className="text-sm text-stone-500">Brak aktywnych ogłoszeń w podglądzie.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {przefiltrowane.map((o) => (
              <li key={o.id}>
                <KartaOgloszeniaRynek oferta={o} href={`${sciezkaWsi}/rynek/${o.id}`} uklad="siatka" />
              </li>
            ))}
          </ul>
        )}
        {pokazLinkWszystkie && oferty.length > (limitWyswietlania ?? 8) ? (
          <p className="text-center">
            <Link href={`${sciezkaWsi}/rynek`} className="text-sm font-medium text-green-800 underline">
              Zobacz pełną listę ogłoszeń →
            </Link>
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {!ukryjPasekAkcji ? (
        <PasekAkcjiRynku
          sciezkaWsi={sciezkaWsi}
          villageId={villageId}
          kotwicaZasadSwietlicy={kotwicaZasadSwietlicy}
          pokazLinkWszystkie={pokazLinkWszystkie}
          liczbaOgloszen={oferty.length}
          kotwicaMapyRynek={kotwicaMapyRynek ?? (liczbaZMapaGeoportal > 0 ? "#rynek-mapa" : undefined)}
        />
      ) : null}

      <div className="sticky z-30 space-y-2 rounded-2xl border border-stone-200/90 bg-[#f5f1e8]/95 p-2.5 shadow-sm backdrop-blur-md sm:p-3 [top:var(--sticky-nav-offset)]">
        {chipyKategorii}
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={fraza}
            onChange={(e) => setFraza(e.target.value)}
            placeholder="Szukaj na liście…"
            className="min-w-[8rem] flex-1 rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
          />
          <select
            value={sortowanie}
            onChange={(e) => setSortowanie(e.target.value as "najnowsze" | "najstarsze" | "polecane")}
            className="rounded-xl border border-stone-200 bg-white px-2 py-1.5 text-xs font-medium text-stone-800"
            aria-label="Sortowanie ogłoszeń"
          >
            <option value="najnowsze">Najnowsze</option>
            <option value="polecane">Polecane</option>
            <option value="najstarsze">Najstarsze</option>
          </select>
          <button
            type="button"
            onClick={() => setFiltryOtwarte((v) => !v)}
            className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-sm hover:border-orange-300"
            aria-expanded={filtryOtwarte}
          >
            Filtry{aktywneFiltry > 0 ? ` (${aktywneFiltry})` : ""}
          </button>
          <div className="flex rounded-lg border border-stone-200 bg-white p-0.5" role="group" aria-label="Widok listy">
            <button
              type="button"
              aria-pressed={widok === "siatka"}
              aria-label="Widok siatki"
              onClick={() => setWidok("siatka")}
              className={`rounded-md px-2 py-1 text-xs font-semibold ${widok === "siatka" ? "bg-orange-100 text-orange-950" : "text-stone-600"}`}
            >
              ⊞
            </button>
            <button
              type="button"
              aria-pressed={widok === "lista"}
              aria-label="Widok listy"
              onClick={() => setWidok("lista")}
              className={`rounded-md px-2 py-1 text-xs font-semibold ${widok === "lista" ? "bg-orange-100 text-orange-950" : "text-stone-600"}`}
            >
              ☰
            </button>
          </div>
          <p className="text-xs text-stone-500">
            <span className="font-semibold text-stone-800">{przefiltrowane.length}</span> wyników
          </p>
        </div>
        {villageId && kategoriaSubskrypcji && nazwaWsi ? (
          <RynekSubskrypcjaKategorii
            villageId={villageId}
            nazwaWsi={nazwaWsi}
            kategoria={kategoriaSubskrypcji}
            zalogowany={zalogowany}
            juzSubskrybuje={
              subskrybowaneKategorie.includes(kategoriaSubskrypcji) || subskrybowaneKategorie.includes(null)
            }
          />
        ) : null}
      </div>

      <div className="overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-sm ring-1 ring-stone-950/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 bg-gradient-to-r from-stone-50/80 to-white px-3 py-2 sm:px-4">
          <div className="flex flex-wrap items-center gap-2">
            {aktywneFiltry > 0 ? (
              <button type="button" onClick={wyczyscFiltry} className="text-xs text-stone-600 underline hover:text-stone-900">
                Wyczyść filtry
              </button>
            ) : null}
            <button
              type="button"
              onClick={kopiujLinkFiltrów}
              className="text-xs font-medium text-green-800 underline hover:text-green-950"
            >
              {kopiujFiltr === "ok" ? "Skopiowano!" : "Kopiuj link z filtrami"}
            </button>
          </div>
          {filtryOtwarte ? (
            <button
              type="button"
              onClick={() => setFiltryOtwarte(false)}
              className="text-xs text-stone-600 underline"
            >
              Zwiń filtry
            </button>
          ) : null}
        </div>

        {filtryOtwarte ? (
          <div className="space-y-3 p-3 sm:p-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <select
                value={typ}
                onChange={(e) => setTyp(e.target.value)}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
              >
                {opcjeTypu.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                value={kategoria}
                onChange={(e) => setKategoria(e.target.value)}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
              >
                <option value="wszystkie">Wszystkie kategorie</option>
                {GRUPY_KATEGORII_RYNKU.map((grupa) => (
                  <optgroup key={grupa.id} label={grupa.label}>
                    {grupa.items.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <select
                value={sortowanie}
                onChange={(e) => setSortowanie(e.target.value as "najnowsze" | "najstarsze" | "polecane")}
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
              >
                <option value="najnowsze">Najnowsze</option>
                <option value="polecane">Polecane (jakość + zweryfikowane)</option>
                <option value="najstarsze">Najstarsze</option>
              </select>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <input
                type="number"
                min={0}
                value={minM2}
                onChange={(e) => setMinM2(e.target.value)}
                placeholder="Min. m²"
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                value={maxM2}
                onChange={(e) => setMaxM2(e.target.value)}
                placeholder="Max. m²"
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                value={minCena}
                onChange={(e) => setMinCena(e.target.value)}
                placeholder="Min. cena (PLN)"
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                value={maxCena}
                onChange={(e) => setMaxCena(e.target.value)}
                placeholder="Max. cena (PLN)"
                className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-stone-800">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={tylkoZweryfikowane}
                  onChange={(e) => setTylkoZweryfikowane(e.target.checked)}
                  className="accent-green-800"
                />
                Tylko zweryfikowani
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={tylkoProduktyLokalne}
                  onChange={(e) => setTylkoProduktyLokalne(e.target.checked)}
                  className="accent-green-800"
                />
                Produkty z gospodarstwa
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={tylkoZOperatorem}
                  onChange={(e) => setTylkoZOperatorem(e.target.checked)}
                  className="accent-green-800"
                />
                Tylko z operatorem
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={tylkoNieruchomosci}
                  onChange={(e) => setTylkoNieruchomosci(e.target.checked)}
                  className="accent-green-800"
                />
                Działki i nieruchomości
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={tylkoZMapaGeoportal}
                  onChange={(e) => setTylkoZMapaGeoportal(e.target.checked)}
                  className="accent-amber-700"
                />
                Tylko z mapą działki (Geoportal)
              </label>
            </div>
          </div>
        ) : null}

        {aktywneFiltry > 0 && !filtryOtwarte ? chipyAktywnychFiltrow : null}
      </div>

      {przefiltrowane.length === 0 ? (
        oferty.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-orange-200/80 bg-gradient-to-br from-orange-50/50 via-white to-emerald-50/30 px-4 py-12 text-center">
            <p className="text-3xl" aria-hidden>
              🏷️
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-800">Jeszcze nie ma ogłoszeń w tej wsi</p>
            <p className="mt-1 text-xs text-stone-500">
              Bądź pierwszy — dodaj produkt z gospodarstwa, maszynę, usługę albo działkę z mapą Geoportalu.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Link
                href="/panel/mieszkaniec/marketplace"
                className="rounded-xl bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900"
              >
                Dodaj ogłoszenie
              </Link>
              <Link
                href="/logowanie?next=/panel/mieszkaniec/marketplace"
                className="rounded-xl border border-green-800 px-4 py-2 text-sm font-semibold text-green-900 hover:bg-green-50"
              >
                Zaloguj się
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-orange-200/80 bg-gradient-to-br from-orange-50/50 via-white to-stone-50 px-4 py-12 text-center">
            <p className="text-3xl" aria-hidden>
              🔍
            </p>
            <p className="mt-2 text-sm font-semibold text-stone-800">Brak ogłoszeń dla wybranych filtrów</p>
            <p className="mt-1 text-xs text-stone-500">Spróbuj zmienić kryteria albo wyczyść filtry.</p>
            {aktywneFiltry > 0 ? (
              <button
                type="button"
                onClick={wyczyscFiltry}
                className="mt-4 rounded-xl bg-green-800 px-4 py-2 text-sm font-semibold text-white hover:bg-green-900"
              >
                Wyczyść filtry
              </button>
            ) : null}
          </div>
        )
      ) : widok === "siatka" ? (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {przefiltrowane.map((o, i) => (
            <li
              key={o.id}
              className="min-h-0 animate-rynek-fade-up"
              style={{ animationDelay: `${Math.min(i * 45, 360)}ms` }}
            >
              <KartaOgloszeniaRynek
                oferta={o}
                href={`${sciezkaWsi}/rynek/${o.id}`}
                uklad="siatka"
                hrefMapy={hrefMapyRynek}
              />
            </li>
          ))}
        </ul>
        ) : (
        <ul className="space-y-3">
          {przefiltrowane.map((o) => (
            <li key={o.id}>
              <KartaOgloszeniaRynek
                oferta={o}
                href={`${sciezkaWsi}/rynek/${o.id}`}
                uklad="lista"
                hrefMapy={hrefMapyRynek}
              />
            </li>
          ))}
        </ul>
        )}

    </div>
  );
}
