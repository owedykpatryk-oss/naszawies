import dynamic from "next/dynamic";
import Link from "next/link";
import type { RynekOfertaPubliczna } from "@/components/wies/marketplace-lista-klient";
import { KartaProfiluRynku } from "@/components/wies/karta-profilu-rynku";
import type { WierszKalendarzaPublicznego } from "@/components/swietlica/kalendarz-zajetosci-publiczny";
import type { SalaPublicznaWsi } from "@/lib/swietlica/pobierz-sale-publiczne-wsi";
import type { WiesPubliczna } from "@/lib/wies/znajdz-wies-po-sciezce";
import { sciezkaProfiluWsi, sciezkaGminy, sciezkaPowiatu, sciezkaWojewodztwa } from "@/lib/wies/sciezka-publiczna";
import { ListaZakupowWsiKlient, type PozycjaListyZakupow } from "@/components/wies/lista-zakupow-wsi-klient";
import { etykietaRodzajuWydarzenia, etykietaTypuGrupy, czyWydarzenieKgw, czyWydarzenieLowieckie, czyWydarzenieOsp, czyWydarzenieParafialne } from "@/lib/wies/teksty-organizacji";
import { parsujProfilParafii, parsujProfilKgw, parsujProfilLowiecki, parsujProfilOsp, czyOrganizacjaOsp } from "@/lib/wies/profil-organizacji";
import { KartaParafiiPubliczna } from "@/components/wies/karta-parafii-publiczna";
import { KartaKgwPubliczna } from "@/components/wies/karta-kgw-publiczna";
import { KartaOspPubliczna } from "@/components/wies/karta-osp-publiczna";
import { KartaMysliwiPubliczna } from "@/components/wies/karta-mysliwi-publiczna";
import { etykietaKategoriiDotacji, nazwaDniaTygodnia } from "@/lib/wies/teksty-dotacji";
import {
  SekcjaPrzewodnikSamorzadowy,
  type PrzewodnikSamorzadowyZapis,
} from "@/components/wies/sekcja-przewodnik-samorzadowy";
import { WiesLaczonyFeedAktualnosci } from "@/components/wies/wies-laczony-feed-aktualnosci";
import { WiesPilneAlerty } from "@/components/wies/wies-pilne-alerty";
import { WiesZgloszeniaPubliczne } from "@/components/wies/wies-zgloszenia-publiczne";
import { PomocSasiedzkaSekcja } from "@/components/wies/pomoc-sasiedzka-sekcja";
import { filtrujPilneAlerty } from "@/lib/wies/filtruj-pilne-alerty";
import { zbudujLaczonyFeedAktualnosci } from "@/lib/wies/zbuduj-laczony-feed-aktualnosci";
import { PrzelacznikTrybuSeniora } from "@/components/ui/tryb-senior-provider";
import { WiesKontaktSzybkiPasek } from "@/components/wies/wies-kontakt-szybki-pasek";
import type { ZakladkaProfiluWsi } from "@/components/wies/wies-zakladki-profilu";
import { LazyWidoczny } from "@/components/ui/lazy-widoczny";
import type { PlakatPubliczny } from "@/components/grafika/galeria-plakatow-wsi";
import { PanelInformacjiMieszkancow } from "@/components/wies/panel-informacji-mieszkancow";
import type { ZnacznikPoi, ZnacznikWsi } from "@/components/mapa/mapa-wsi-leaflet";
import type { LinkPrzydatnyPubliczny } from "@/lib/wies/linki-przydatne";
import { MojeObserwujWiesPasek } from "@/components/panel/moje/moje-obserwuj-wies-pasek";
import { BanerDolaczDoWsi } from "@/components/wies/baner-dolacz-do-wsi";
import { SpolecznyDowodWsi } from "@/components/wies/spoleczny-dowod-wsi";
import { RynekUdostepnijPrzycisk } from "@/components/wies/rynek-udostepnij-przycisk";
import { ZapiszTrescPrzycisk } from "@/components/panel/moje/zapisz-tresc-przycisk";
import { KARTA_LISTY_WIES, OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";
import { SekcjaDaneGeoWsiLazy } from "@/components/wies/sekcja-dane-geo-wsi-lazy";
import { WiesTransportLazy } from "@/components/wies/wies-transport-lazy";
import { WiesRolnictwoLazy } from "@/components/wies/wies-rolnictwo-lazy";
import { linkChroniony } from "@/lib/auth/sciezki-chronione";
import { SwietliceWsiLazy } from "@/components/wies/swietlice-wsi-lazy";
import type { KonkursFotoPubliczny, ZdjecieKonkursu } from "@/lib/konkurs-foto/fazy-konkursu";
import type { OstrzezenieLowieckie } from "@/lib/lowiectwo/pobierz-ostrzezenia-publiczne";
import type { ZdjeciePubliczne } from "@/lib/fotokronika/pobierz-fotokronike-publiczna";

const GaleriaPlakatowWsi = dynamic(
  () => import("@/components/grafika/galeria-plakatow-wsi").then((m) => ({ default: m.GaleriaPlakatowWsi })),
  {
    loading: () => (
      <section className="sekcja-poza-foldem mt-12 h-48 animate-pulse rounded-2xl bg-stone-100" aria-hidden />
    ),
  },
);

const MarketplaceListaKlient = dynamic(
  () => import("@/components/wies/marketplace-lista-klient").then((m) => ({ default: m.MarketplaceListaKlient })),
  {
    loading: () => <section className="mt-8 h-40 animate-pulse rounded-2xl bg-stone-100" aria-hidden />,
  },
);

const WiesZakladkiProfilu = dynamic(
  () => import("@/components/wies/wies-zakladki-profilu").then((m) => ({ default: m.WiesZakladkiProfilu })),
  {
    ssr: false,
    loading: () => <div className="mt-4 h-9 animate-pulse rounded-full bg-stone-100" aria-hidden />,
  },
);

const MapaWsiProfilEmbedded = dynamic(
  () => import("@/components/wies/mapa-wsi-profil-embedded").then((m) => ({ default: m.MapaWsiProfilEmbedded })),
  {
    ssr: false,
    loading: () => (
      <section className="mt-8 h-[min(280px,40dvh)] animate-pulse rounded-2xl bg-stone-100" aria-hidden />
    ),
  },
);

const FotokronikaPublicznaWsi = dynamic(
  () => import("@/components/wies/fotokronika-publiczna-wsi").then((m) => ({ default: m.FotokronikaPublicznaWsi })),
  { loading: () => <section className="mt-12 h-40 animate-pulse rounded-2xl bg-stone-100" aria-hidden /> },
);

const KonkursFotoWsiKlient = dynamic(
  () => import("@/components/wies/konkurs-foto-wsi-klient").then((m) => ({ default: m.KonkursFotoWsiKlient })),
  { ssr: false, loading: () => <section className="mt-12 h-40 animate-pulse rounded-2xl bg-stone-100" aria-hidden /> },
);

const OstrzezeniaLowieckieWsi = dynamic(
  () => import("@/components/wies/ostrzezenia-lowieckie-wsi").then((m) => ({ default: m.OstrzezeniaLowieckieWsi })),
  { loading: () => null },
);

type WpisPostu = {
  id: string;
  title: string;
  type: string;
  created_at: string;
  is_pinned?: boolean | null;
  event_end_at?: string | null;
};

export function WiesProfilPubliczny({
  wies,
  posty,
  blog = [],
  historia = [],
  rynek = [],
  wiadomosci = [],
  profileUslug = [],
  organizacje = [],
  wydarzenia = [],
  pomocSasiedzka = [],
  zgloszeniaPubliczne = [],
  listaZakupow = [],
  mozeZobaczycListeZakupow = false,
  mozeEdytowacListeZakupow = false,
  harmonogramTygodnia = [],
  dotacjeSkrot = [],
  przewodnikSamorzadowy = null,
  linkiPrzydatne = [],
  kontaktyUrzedowe = [],
  kadencjeFunkcyjne = [],
  plakatyPubliczne = [],
  konkursFoto = null,
  fotokronikaPubliczna = [],
  ostrzezeniaLowieckie = [],
  zalogowany = false,
  zapisaneTresci = {},
  mapaZnacznik = null,
  mapaPoi = [],
  maPlanCmentarza = false,
  liczbaMieszkancowAktywnych = 0,
}: {
  wies: WiesPubliczna;
  posty: WpisPostu[];
  kalendarzZajetosci?: WierszKalendarzaPublicznego[];
  saleSwietlicy?: SalaPublicznaWsi[];
  plakatyPubliczne?: PlakatPubliczny[];
  konkursFoto?: {
    konkurs: KonkursFotoPubliczny;
    zdjecia: ZdjecieKonkursu[];
    mojGlosPhotoId: string | null;
  } | null;
  fotokronikaPubliczna?: ZdjeciePubliczne[];
  ostrzezeniaLowieckie?: OstrzezenieLowieckie[];
  blog?: {
    id: string;
    title: string;
    excerpt: string | null;
    published_at: string | null;
    created_at: string;
  }[];
  historia?: {
    id: string;
    title: string;
    short_description: string | null;
    event_date: string | null;
    created_at: string;
  }[];
  rynek?: RynekOfertaPubliczna[];
  wiadomosci?: {
    id: string;
    title: string;
    summary: string | null;
    category: string | null;
    source_name: string | null;
    published_at: string | null;
    created_at: string;
  }[];
  profileUslug?: {
    id: string;
    business_name: string;
    short_description: string | null;
    categories: string[] | null;
    phone: string | null;
    is_verified: boolean;
  }[];
  organizacje?: {
    id: string;
    group_type: string;
    name: string;
    short_description: string | null;
    meeting_place: string | null;
    schedule_text: string | null;
    contact_phone: string | null;
    contact_email?: string | null;
    profile_data?: unknown;
  }[];
  wydarzenia?: {
    id: string;
    event_kind: string;
    title: string;
    description: string | null;
    location_text: string | null;
    starts_at: string;
    ends_at: string | null;
    nazwa_grupy: string | null;
  }[];
  listaZakupow?: PozycjaListyZakupow[];
  mozeZobaczycListeZakupow?: boolean;
  mozeEdytowacListeZakupow?: boolean;
  harmonogramTygodnia?: {
    id: string;
    day_of_week: number;
    time_start: string;
    time_end: string | null;
    title: string;
    description: string | null;
    nazwa_grupy: string | null;
  }[];
  dotacjeSkrot?: {
    id: string;
    category: string;
    title: string;
    summary: string | null;
    application_deadline: string | null;
  }[];
  przewodnikSamorzadowy?: PrzewodnikSamorzadowyZapis | null;
  linkiPrzydatne?: LinkPrzydatnyPubliczny[];
  kontaktyUrzedowe?: {
    id: string;
    office_key: string;
    role_label: string;
    person_name: string;
    organization_name: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    duty_hours_text: string | null;
    note: string | null;
    cta_label: string | null;
    cta_url: string | null;
    is_verified_by_soltys: boolean;
    updated_at: string;
  }[];
  kadencjeFunkcyjne?: {
    id: string;
    office_key: string;
    role_label: string;
    person_name: string;
    organization_name: string | null;
    term_start: string;
    term_end: string | null;
    note: string | null;
    is_current: boolean;
  }[];
  pomocSasiedzka?: import("@/components/wies/pomoc-sasiedzka-sekcja").OfertaPomocyPubliczna[];
  zgloszeniaPubliczne?: import("@/components/wies/wies-zgloszenia-publiczne").ZgloszeniePubliczne[];
  zalogowany?: boolean;
  /** Klucz `post:id` lub `event:id` → ID wiersza w user_saved_content. */
  zapisaneTresci?: Record<string, string>;
  mapaZnacznik?: ZnacznikWsi | null;
  mapaPoi?: ZnacznikPoi[];
  /** Opublikowany plan cmentarza (kwatery / rzędy / groby). */
  maPlanCmentarza?: boolean;
  /** Aktywni mieszkańcy zatwierdzeni w serwisie (social proof). */
  liczbaMieszkancowAktywnych?: number;
}) {
  const sciezka = sciezkaProfiluWsi(wies);
  const parafie = organizacje.filter((o) => o.group_type === "parafia");
  const poiKosciol = mapaPoi.find((poi) => poi.category === "kosciol");
  const poiCmentarz = mapaPoi.find((poi) => poi.category === "cmentarz");
  const linkKosciolNaMapie = poiKosciol
    ? `/mapa/miejsce/${poiKosciol.id}`
    : mapaPoi.length > 0 || mapaZnacznik
      ? `${sciezka}#sekcja-mapa`
      : null;
  const linkCmentarzNaMapie = poiCmentarz ? `/mapa/miejsce/${poiCmentarz.id}` : null;
  const linkPlanCmentarza = maPlanCmentarza ? `${sciezka}/cmentarz` : null;
  const poiSwietlica = mapaPoi.find((poi) => poi.category === "swietlica");
  const linkMiejsceKgwNaMapie = poiSwietlica
    ? `/mapa/miejsce/${poiSwietlica.id}`
    : mapaPoi.length > 0 || mapaZnacznik
      ? `${sciezka}#sekcja-mapa`
      : null;
  const poiRemiza = mapaPoi.find((poi) => poi.category === "osp");
  const poiWodaOsp = mapaPoi.find((poi) => poi.category === "osp_punkt_czerpania_wody");
  const linkRemizaNaMapie = poiRemiza
    ? `/mapa/miejsce/${poiRemiza.id}`
    : mapaPoi.length > 0 || mapaZnacznik
      ? `${sciezka}#sekcja-mapa`
      : null;
  const linkPunktyWodyOsp =
    poiWodaOsp
      ? `/mapa/miejsce/${poiWodaOsp.id}`
      : mapaPoi.some((poi) => poi.category === "osp_punkt_czerpania_wody")
        ? `${sciezka}#sekcja-mapa`
        : null;
  const kolaKgw = organizacje.filter((o) => o.group_type === "kgw");
  const kolaLowieckie = organizacje.filter((o) => o.group_type === "lowiectwo");
  const jednostkiOsp = organizacje.filter((o) => czyOrganizacjaOsp(o.group_type, o.name));
  const organizacjePozostale = organizacje.filter(
    (o) =>
      o.group_type !== "parafia" &&
      o.group_type !== "kgw" &&
      o.group_type !== "lowiectwo" &&
      !czyOrganizacjaOsp(o.group_type, o.name),
  );
  const prefixOgloszenia = `${sciezka}/ogloszenie`;
  const pilneAlerty = filtrujPilneAlerty(posty);
  const laczonyFeed = zbudujLaczonyFeedAktualnosci(
    sciezka,
    posty,
    blog,
    historia,
    wiadomosci,
    wydarzenia,
    rynek,
    wies.id,
    16,
  );

  const maPrzewodnik =
    !!przewodnikSamorzadowy &&
    [
      przewodnikSamorzadowy.commune_info,
      przewodnikSamorzadowy.county_info,
      przewodnikSamorzadowy.voivodeship_info,
      przewodnikSamorzadowy.roads_info,
      przewodnikSamorzadowy.waste_info,
      przewodnikSamorzadowy.utilities_info,
      przewodnikSamorzadowy.other_info,
    ].some((x) => x && x.trim().length > 0);

  const maRynek = profileUslug.length > 0 || rynek.length > 0;
  const maBlogLubHistorie = blog.length > 0 || historia.length > 0;
  const maOrganizacje =
    parafie.length > 0 ||
    kolaKgw.length > 0 ||
    jednostkiOsp.length > 0 ||
    kolaLowieckie.length > 0 ||
    organizacjePozostale.length > 0 ||
    wydarzenia.length > 0;
  const maPomocSasiedzka = pomocSasiedzka.length > 0 || zalogowany;

  const zakladkiProfilu: ZakladkaProfiluWsi[] = [
    { href: "#informacje-mieszkancow", label: "Informacje" },
    ...(maRynek ? [{ href: "#sekcja-rynek-lokalny", label: "Rynek" }] : []),
    { href: "#sekcja-mapa", label: "Mapa" },
    { href: "#sekcja-aktualnosci-laczone", label: "Aktualności" },
    ...(maPomocSasiedzka ? [{ href: "#sekcja-pomoc-sasiedzka", label: "Pomoc sąsiedzka" }] : []),
    ...(maBlogLubHistorie ? [{ href: "#sekcja-blog-historia", label: "Blog" }] : []),
    ...(maOrganizacje ? [{ href: "#sekcja-organizacje", label: "Organizacje" }] : []),
    ...(dotacjeSkrot.length > 0 ? [{ href: "#sekcja-dotacje", label: "Dotacje" }] : []),
    { href: "#sekcja-transport", label: "Transport" },
    { href: "#sekcja-rolnictwo", label: "Rolnictwo" },
    { href: "#swietlice-wsi", label: "Świetlica" },
    ...(maPlanCmentarza ? [{ href: `${sciezka}/cmentarz`, label: "Cmentarz" }] : []),
  ];

  return (
    <article>
      <a
        href="#informacje-mieszkancow"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-green-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Przejdź do informacji dla mieszkańców
      </a>

      {wies.cover_image_url ? (
        <div className="relative mb-8 aspect-[21/9] max-h-64 overflow-hidden rounded-2xl border border-stone-200/90 bg-stone-100 shadow-sm ring-1 ring-stone-900/[0.03]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={wies.cover_image_url}
            alt={`Okładka profilu wsi ${wies.name}`}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-stone-950/35 via-transparent to-transparent" aria-hidden />
        </div>
      ) : null}

      <header className="wow-wejscie border-b border-stone-200/90 pb-6">
        <nav className="text-sm text-stone-500" aria-label="Ścieżka nawigacji">
          <Link href={sciezkaWojewodztwa(wies.voivodeship)} className="text-green-800 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800">
            {wies.voivodeship}
          </Link>
          {" · "}
          <Link
            href={sciezkaPowiatu({ voivodeship: wies.voivodeship, county: wies.county })}
            className="text-green-800 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800"
          >
            pow. {wies.county}
          </Link>
          {" · "}
          <Link
            href={sciezkaGminy({ voivodeship: wies.voivodeship, county: wies.county, commune: wies.commune })}
            className="text-green-800 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800"
          >
            {wies.commune}
          </Link>
          {wies.is_active ? null : (
            <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
              Profil w przygotowaniu
            </span>
          )}
        </nav>
        <div className="mt-3 flex flex-wrap items-start gap-x-4 gap-y-2">
          <h1 className="font-serif text-3xl text-green-950 sm:text-4xl">{wies.name}</h1>
          {wies.is_active ? (
            <span className="mt-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900 ring-1 ring-emerald-200/80">
              Aktywny profil
            </span>
          ) : null}
          <RynekUdostepnijPrzycisk
            url={sciezka}
            tytul={`${wies.name} — naszawies.pl`}
            tekst={`Zobacz profil wsi ${wies.name} na naszawies.pl — ogłoszenia, mapa i społeczność lokalna.`}
          />
        </div>
        <SpolecznyDowodWsi
          liczbaMieszkancow={liczbaMieszkancowAktywnych}
          liczbaOgloszen={rynek.length}
          liczbaAktualnosci={laczonyFeed.length}
          aktywnyProfil={wies.is_active}
        />
        {wies.population != null && wies.population > 0 ? (
          <p className="mt-2 text-sm text-stone-600">
            Szacunkowa liczba mieszkańców:{" "}
            <span className="font-semibold tabular-nums text-green-950">{wies.population.toLocaleString("pl-PL")}</span>
          </p>
        ) : wies.gmina_population != null && wies.gmina_population > 0 ? (
          <p className="mt-2 text-sm text-stone-600">
            Ludność gminy {wies.commune}
            {wies.gmina_population_rok ? ` (${wies.gmina_population_rok}, GUS)` : ""}:{" "}
            <span className="font-semibold tabular-nums text-green-950">
              {wies.gmina_population.toLocaleString("pl-PL")}
            </span>
            <span className="text-stone-500"> — dane dla całej gminy, nie tylko tej wsi</span>
          </p>
        ) : null}
        {wies.website ? (
          <p className="mt-3 text-sm">
            <a
              href={wies.website}
              className="text-green-800 underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              Strona gminy / sołectwa
            </a>
          </p>
        ) : null}
        {wies.latitude != null && wies.longitude != null ? (
          <details className="mt-2 text-xs text-stone-500">
            <summary className="cursor-pointer font-medium text-green-800 hover:underline">Szczegóły techniczne</summary>
            <p className="mt-1">
              Współrzędne: {Number(wies.latitude).toFixed(5)}, {Number(wies.longitude).toFixed(5)} ·{" "}
              <a
                href={`https://www.openstreetmap.org/?mlat=${wies.latitude}&mlon=${wies.longitude}&zoom=14`}
                className="text-green-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Otwórz na mapie
              </a>
              {wies.updated_at ? (
                <>
                  {" "}
                  · Katalog: {new Date(wies.updated_at).toLocaleDateString("pl-PL")}
                </>
              ) : null}
            </p>
          </details>
        ) : wies.updated_at ? (
          <p className="mt-2 text-xs text-stone-500">
            Katalog wsi: {new Date(wies.updated_at).toLocaleDateString("pl-PL")}
          </p>
        ) : null}
        <p className="mt-2">
          <Link href={`${sciezka}/szukaj`} className="text-xs text-green-800 underline">
            Szukaj na stronie wsi
          </Link>
        </p>
        <MojeObserwujWiesPasek
          villageId={wies.id}
          wies={{
            name: wies.name,
            slug: wies.slug,
            voivodeship: wies.voivodeship,
            county: wies.county,
            commune: wies.commune,
          }}
        />
        <BanerDolaczDoWsi nazwaWsi={wies.name} villageId={wies.id} zalogowany={zalogowany} />
        <WiesZakladkiProfilu zakladki={zakladkiProfilu} />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <PrzelacznikTrybuSeniora />
        </div>
      </header>

      <WiesPilneAlerty alerty={pilneAlerty} sciezkaOgloszenia={prefixOgloszenia} />
      <OstrzezeniaLowieckieWsi
        ostrzezenia={ostrzezeniaLowieckie}
        nazwaWsi={wies.name}
        maProfilKola={kolaLowieckie.length > 0}
        zalogowany={zalogowany}
      />
      <WiesKontaktSzybkiPasek kontakty={kontaktyUrzedowe} />

      {wies.description ? (
        <OslonaSekcjiWies className="mt-8">
          <TytulSekcjiWies etykieta="Opis" tytul="O miejscowości" />
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{wies.description}</div>
        </OslonaSekcjiWies>
      ) : null}

      <PanelInformacjiMieszkancow
        wies={wies}
        linkiPrzydatne={linkiPrzydatne}
        maPrzewodnik={maPrzewodnik}
        maKontakty={kontaktyUrzedowe.length > 0}
        maWiadomosci={wiadomosci.length > 0}
        maSwietlice={wies.is_active}
        maRynek={maRynek}
        maDotacje={dotacjeSkrot.length > 0}
        maTransport={wies.is_active}
        maMape={wies.is_active}
      />

      <LazyWidoczny
        placeholder={
          <section className="mt-8 h-[min(280px,40dvh)] animate-pulse rounded-2xl bg-stone-100" aria-hidden />
        }
      >
        <MapaWsiProfilEmbedded
          nazwaWsi={wies.name}
          villageId={wies.id}
          zalogowany={zalogowany}
          znacznik={mapaZnacznik}
          pois={mapaPoi}
        />
      </LazyWidoczny>

      <SekcjaPrzewodnikSamorzadowy wies={wies} przewodnik={przewodnikSamorzadowy} />

      <WiesLaczonyFeedAktualnosci wpisy={laczonyFeed} />

      {maRynek ? (
        <OslonaSekcjiWies id="sekcja-rynek-lokalny">
          <div className="rynek-hero-wow mb-6 !p-4 sm:!p-5">
            <TytulSekcjiWies
              etykieta="Rynek"
              tytul="Darmowy rynek lokalny"
              opis="Produkty z gospodarstw, maszyny i usługi mieszkańców — bezpłatnie, z wiadomościami między zalogowanymi użytkownikami."
            />
            <div className="relative z-[1] mt-4 flex flex-wrap gap-2">
              <Link
                href={`${sciezka}/rynek`}
                className="rounded-xl bg-gradient-to-br from-green-800 to-green-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-green-900 hover:to-green-950"
              >
                Przeglądaj wszystkie ogłoszenia
              </Link>
              <Link
                href="/panel/mieszkaniec/marketplace"
                className="rounded-xl border border-green-800/40 bg-white/90 px-4 py-2 text-sm font-semibold text-green-900 shadow-sm transition hover:bg-green-50"
              >
                + Dodaj ogłoszenie
              </Link>
            </div>
          </div>

          {profileUslug.length > 0 ? (
            <section className="mt-6">
              <h3 className="text-sm font-semibold text-stone-800">Profile usługodawców</h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {profileUslug.map((p) => (
                  <li key={p.id}>
                    <KartaProfiluRynku profil={p} sciezkaWsi={sciezka} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {rynek.length > 0 ? (
            <section className={profileUslug.length > 0 ? "mt-8" : "mt-6"}>
              <h3 className="text-sm font-semibold text-stone-800">
                {profileUslug.length > 0 ? "Najnowsze ogłoszenia" : "Ogłoszenia"}
              </h3>
              <MarketplaceListaKlient
                oferty={rynek}
                sciezkaWsi={sciezka}
                villageId={wies.id}
                kotwicaZasadSwietlicy={`${sciezka}#swietlica-regulamin`}
                limitWyswietlania={6}
                tryb="skrot"
                ukryjPasekAkcji
              />
            </section>
          ) : profileUslug.length > 0 ? (
            <p className="mt-4 text-sm text-stone-500">Brak aktywnych ogłoszeń — zobacz profile usługodawców powyżej.</p>
          ) : null}
        </OslonaSekcjiWies>
      ) : null}

      <PomocSasiedzkaSekcja
        oferty={pomocSasiedzka}
        sciezkaPanelu="/panel/mieszkaniec/pomoc-sasiedzka"
        zalogowany={zalogowany}
      />

      <WiesZgloszeniaPubliczne wiersze={zgloszeniaPubliczne} />

      <LazyWidoczny
        placeholder={
          <section className="sekcja-poza-foldem mt-12 h-48 animate-pulse rounded-2xl bg-stone-100" aria-hidden />
        }
      >
        <GaleriaPlakatowWsi plakaty={plakatyPubliczne} nazwaWsi={wies.name} />
      </LazyWidoczny>

      <FotokronikaPublicznaWsi zdjecia={fotokronikaPubliczna} nazwaWsi={wies.name} pokazLinkDodaj={zalogowany} />

      {konkursFoto ? (
        <KonkursFotoWsiKlient
          konkurs={konkursFoto.konkurs}
          zdjecia={konkursFoto.zdjecia}
          mojGlosPhotoId={konkursFoto.mojGlosPhotoId}
          zalogowany={zalogowany}
          nazwaWsi={wies.name}
          sciezkaPaneluFoto="/panel/mieszkaniec/fotokronika"
        />
      ) : null}

      <WiesTransportLazy villageId={wies.id} zalogowany={zalogowany} />

      <WiesRolnictwoLazy villageId={wies.id} zalogowany={zalogowany} />

      <OslonaSekcjiWies id="kontakty-urzedowe-wsi" pusta={kontaktyUrzedowe.length === 0}>
        <TytulSekcjiWies
          etykieta="Kontakt"
          tytul="Kontakt urzędowy i osoby funkcyjne"
          opis="Sołtys, parafia, OSP, KGW — z dyżurami, weryfikacją i historią kadencji."
        />
        {kontaktyUrzedowe.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Brak opublikowanych kontaktów urzędowych.</p>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <ul className="space-y-3">
              {kontaktyUrzedowe.map((k) => (
                <li key={k.id} className={KARTA_LISTY_WIES}>
                  <p className="text-xs text-sky-800">{k.role_label}</p>
                  <p className="mt-1 font-medium text-stone-900">{k.person_name}</p>
                  {k.organization_name ? <p className="text-xs text-stone-600">{k.organization_name}</p> : null}
                  {k.duty_hours_text ? (
                    <p className="mt-2 text-xs text-stone-600">
                      <span className="font-medium">Dyżur:</span> {k.duty_hours_text}
                    </p>
                  ) : null}
                  {k.contact_phone ? <p className="mt-1 text-xs text-stone-600">Tel. {k.contact_phone}</p> : null}
                  {k.contact_email ? <p className="text-xs text-stone-600">E-mail: {k.contact_email}</p> : null}
                  <p className="mt-2 text-xs text-stone-500">
                    {k.is_verified_by_soltys ? "Zweryfikowany przez sołtysa" : "Niezweryfikowany"} · aktualizacja{" "}
                    {new Date(k.updated_at).toLocaleDateString("pl-PL")}
                  </p>
                  {k.note ? <p className="mt-2 text-xs text-stone-700">{k.note}</p> : null}
                  {k.cta_label && k.cta_url ? (
                    <p className="mt-2">
                      <a
                        href={k.cta_url}
                        className="text-sm font-medium text-green-800 underline"
                        target={k.cta_url.startsWith("http") ? "_blank" : undefined}
                        rel={k.cta_url.startsWith("http") ? "noopener noreferrer" : undefined}
                      >
                        {k.cta_label}
                      </a>
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Kadencje i historia</h3>
              {kadencjeFunkcyjne.length === 0 ? (
                <p className="mt-3 text-sm text-stone-500">Brak wpisów historii kadencji.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {kadencjeFunkcyjne.map((k) => (
                    <li key={k.id} className={KARTA_LISTY_WIES}>
                      <p className="font-medium text-stone-900">
                        {k.role_label}: {k.person_name}
                      </p>
                      <p className="mt-1 text-xs text-stone-600">
                        {new Date(k.term_start).toLocaleDateString("pl-PL")} –{" "}
                        {k.term_end ? new Date(k.term_end).toLocaleDateString("pl-PL") : "obecnie"}
                        {k.is_current ? " · obecna kadencja" : ""}
                      </p>
                      {k.note ? <p className="mt-1 text-xs text-stone-700">{k.note}</p> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </OslonaSekcjiWies>

      {posty.length > 0 ? (
        <OslonaSekcjiWies>
          <TytulSekcjiWies
            etykieta="Ogłoszenia"
            tytul="Ogłoszenia i oferty"
            opis={
              laczonyFeed.length > 0
                ? "Pełna lista ogłoszeń — najnowsze wpisy widać także w skrócie „Najnowsze na wsi” powyżej."
                : "Zatwierdzone oferty publiczne. Pozostałe treści — po zalogowaniu z rolą mieszkańca."
            }
          />
          <ul className="mt-5 space-y-2">
            {posty.map((p) => (
              <li key={p.id}>
                <div className={`${KARTA_LISTY_WIES} flex flex-wrap items-start justify-between gap-2`}>
                  <Link href={`${prefixOgloszenia}/${p.id}`} className="min-w-0 flex-1">
                    <p className="font-medium text-stone-900">{p.title}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {p.type} · {new Date(p.created_at).toLocaleDateString("pl-PL")}
                    </p>
                  </Link>
                  {zalogowany ? (
                    <ZapiszTrescPrzycisk
                      villageId={wies.id}
                      contentType="post"
                      contentId={p.id}
                      title={p.title}
                      href={`${prefixOgloszenia}/${p.id}`}
                      zapisaneId={zapisaneTresci[`post:${p.id}`]}
                    />
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </OslonaSekcjiWies>
      ) : null}

      {(blog.length > 0 || historia.length > 0) ? (
        <OslonaSekcjiWies id="sekcja-blog-historia">
          <TytulSekcjiWies
            etykieta="Społeczność"
            tytul="Blog i kronika mieszkańców"
            opis="Lokalne wpisy i materiały historyczne zatwierdzane przez sołtysa."
          />
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
            <Link href={`${sciezka}/blog`} className="text-green-800 underline">
              Wszystkie wpisy bloga
            </Link>
            <Link href={`${sciezka}/historia`} className="text-green-800 underline">
              Pełna historia wsi
            </Link>
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {blog.map((w) => (
              <Link key={`blog-${w.id}`} href={`${sciezka}/blog/${w.id}`} className={`${KARTA_LISTY_WIES} block`}>
                <p className="text-xs uppercase tracking-wide text-green-800">Blog</p>
                <p className="mt-1 font-medium text-stone-900">{w.title}</p>
                {w.excerpt ? <p className="mt-1 line-clamp-2 text-xs text-stone-600">{w.excerpt}</p> : null}
                <p className="mt-2 text-xs text-stone-500">
                  {new Date(w.published_at ?? w.created_at).toLocaleDateString("pl-PL")}
                </p>
              </Link>
            ))}
            {historia.map((w) => (
              <Link key={`historia-${w.id}`} href={`${sciezka}/historia/${w.id}`} className={`${KARTA_LISTY_WIES} block`}>
                <p className="text-xs uppercase tracking-wide text-amber-700">Historia wsi</p>
                <p className="mt-1 font-medium text-stone-900">{w.title}</p>
                {w.short_description ? <p className="mt-1 line-clamp-2 text-xs text-stone-600">{w.short_description}</p> : null}
                <p className="mt-2 text-xs text-stone-500">
                  {w.event_date
                    ? new Date(w.event_date).toLocaleDateString("pl-PL")
                    : new Date(w.created_at).toLocaleDateString("pl-PL")}
                </p>
              </Link>
            ))}
          </div>
        </OslonaSekcjiWies>
      ) : null}

      {(parafie.length > 0 || kolaKgw.length > 0 || jednostkiOsp.length > 0 || kolaLowieckie.length > 0 || organizacjePozostale.length > 0 || wydarzenia.length > 0) ? (
        <OslonaSekcjiWies id="sekcja-organizacje">
          <TytulSekcjiWies
            etykieta="Organizacje"
            tytul="Koła, kluby i kalendarz wydarzeń"
            opis="Koła Gospodyń, sekcje sportowe, zespoły — oraz zbliżające się wydarzenia. Pełny kalendarz: link poniżej."
          />
          <p className="mt-2 text-xs text-stone-600">
            <Link href={`${sciezka}/wydarzenia`} className="text-green-800 underline">
              Zobacz pełny kalendarz wydarzeń
            </Link>
          </p>

          {parafie.length > 0 ? (
            <div className="mt-5 space-y-4">
              {parafie.map((p) => (
                <KartaParafiiPubliczna
                  key={p.id}
                  parafia={{
                    id: p.id,
                    name: p.name,
                    short_description: p.short_description,
                    meeting_place: p.meeting_place,
                    schedule_text: p.schedule_text,
                    contact_phone: p.contact_phone,
                    contact_email: p.contact_email ?? null,
                    profil: parsujProfilParafii(p.profile_data),
                  }}
                  sciezkaProfilu={sciezka}
                  sciezkaWydarzenia={`${sciezka}/wydarzenia`}
                  linkKosciolNaMapie={linkKosciolNaMapie}
                  linkCmentarzNaMapie={linkCmentarzNaMapie}
                  linkPlanCmentarza={linkPlanCmentarza}
                  nadchodzaceWydarzenia={wydarzenia
                    .filter((ev) => czyWydarzenieParafialne(ev.event_kind, ev.nazwa_grupy, p.name))
                    .slice(0, 4)}
                />
              ))}
            </div>
          ) : null}

          {kolaKgw.length > 0 ? (
            <div className={`space-y-4 ${parafie.length > 0 ? "mt-6" : "mt-5"}`}>
              {kolaKgw.map((k) => (
                <KartaKgwPubliczna
                  key={k.id}
                  kgw={{
                    id: k.id,
                    name: k.name,
                    short_description: k.short_description,
                    meeting_place: k.meeting_place,
                    schedule_text: k.schedule_text,
                    contact_phone: k.contact_phone,
                    contact_email: k.contact_email ?? null,
                    profil: parsujProfilKgw(k.profile_data),
                  }}
                  sciezkaProfilu={sciezka}
                  sciezkaWydarzenia={`${sciezka}/wydarzenia`}
                  sciezkaDotacje={`${sciezka}/dotacje`}
                  sciezkaRynek={maRynek ? `${sciezka}/rynek` : undefined}
                  linkMiejsceNaMapie={linkMiejsceKgwNaMapie}
                  nadchodzaceWydarzenia={wydarzenia
                    .filter((ev) => czyWydarzenieKgw(ev.event_kind, ev.nazwa_grupy, k.name))
                    .slice(0, 4)}
                />
              ))}
            </div>
          ) : null}

          {jednostkiOsp.length > 0 ? (
            <div className={`space-y-4 ${parafie.length > 0 || kolaKgw.length > 0 ? "mt-6" : "mt-5"}`}>
              {jednostkiOsp.map((o) => (
                <KartaOspPubliczna
                  key={o.id}
                  osp={{
                    id: o.id,
                    name: o.name,
                    short_description: o.short_description,
                    meeting_place: o.meeting_place,
                    schedule_text: o.schedule_text,
                    contact_phone: o.contact_phone,
                    contact_email: o.contact_email ?? null,
                    profil: parsujProfilOsp(o.profile_data),
                  }}
                  sciezkaProfilu={sciezka}
                  sciezkaWydarzenia={`${sciezka}/wydarzenia`}
                  linkRemizaNaMapie={linkRemizaNaMapie}
                  linkPunktyWodyNaMapie={linkPunktyWodyOsp}
                  nadchodzaceWydarzenia={wydarzenia
                    .filter((ev) => czyWydarzenieOsp(ev.event_kind, ev.nazwa_grupy, o.name))
                    .slice(0, 4)}
                />
              ))}
            </div>
          ) : null}

          {kolaLowieckie.length > 0 ? (
            <div
              className={`space-y-4 ${parafie.length > 0 || kolaKgw.length > 0 || jednostkiOsp.length > 0 ? "mt-6" : "mt-5"}`}
            >
              {kolaLowieckie.map((k) => {
                const pierwszeOstrzezenie = ostrzezeniaLowieckie[0] ?? null;
                return (
                  <KartaMysliwiPubliczna
                    key={k.id}
                    kolo={{
                      id: k.id,
                      name: k.name,
                      short_description: k.short_description,
                      meeting_place: k.meeting_place,
                      schedule_text: k.schedule_text,
                      contact_phone: k.contact_phone,
                      contact_email: k.contact_email ?? null,
                      profil: parsujProfilLowiecki(k.profile_data),
                    }}
                    maAktywneOstrzezenia={ostrzezeniaLowieckie.length > 0}
                    ostrzezenieAktywne={
                      pierwszeOstrzezenie
                        ? {
                            id: pierwszeOstrzezenie.id,
                            title: pierwszeOstrzezenie.title,
                            startsAt: pierwszeOstrzezenie.startsAt,
                            endsAt: pierwszeOstrzezenie.endsAt,
                            maObszarMapy: pierwszeOstrzezenie.maObszarMapy,
                          }
                        : null
                    }
                    sciezkaProfilu={sciezka}
                    sciezkaWydarzenia={`${sciezka}/wydarzenia`}
                    zalogowany={zalogowany}
                    nadchodzaceWydarzenia={wydarzenia
                      .filter((ev) => czyWydarzenieLowieckie(ev.event_kind, ev.nazwa_grupy, k.name))
                      .slice(0, 4)}
                  />
                );
              })}
            </div>
          ) : null}

          <div
            className={`grid gap-6 lg:grid-cols-2 ${
              parafie.length > 0 || kolaKgw.length > 0 || jednostkiOsp.length > 0 || kolaLowieckie.length > 0 ? "mt-6" : "mt-5"
            }`}
          >
            {organizacjePozostale.length > 0 ? (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Organizacje</h3>
                <ul className="mt-3 space-y-3">
                  {organizacjePozostale.map((o) => (
                    <li key={o.id} className={KARTA_LISTY_WIES}>
                      <p className="text-xs text-rose-800">{etykietaTypuGrupy(o.group_type)}</p>
                      <p className="mt-1 font-medium text-stone-900">{o.name}</p>
                      {o.short_description ? <p className="mt-1 text-sm text-stone-700">{o.short_description}</p> : null}
                      {o.meeting_place ? (
                        <p className="mt-2 text-xs text-stone-600">
                          <span className="font-medium">Miejsce:</span> {o.meeting_place}
                        </p>
                      ) : null}
                      {o.schedule_text ? (
                        <p className="mt-1 text-xs text-stone-600">
                          <span className="font-medium">Terminy:</span> {o.schedule_text}
                        </p>
                      ) : null}
                      {o.contact_phone ? <p className="mt-2 text-xs text-stone-500">Tel. {o.contact_phone}</p> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {wydarzenia.length > 0 ? (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Nadchodzące wydarzenia</h3>
                <ul className="mt-3 space-y-3">
                  {wydarzenia.map((ev) => (
                    <li key={ev.id}>
                      <div className={`${KARTA_LISTY_WIES} flex flex-wrap items-start justify-between gap-2`}>
                        <Link href={`${sciezka}/wydarzenia/${ev.id}`} className="min-w-0 flex-1">
                          <p className="text-xs text-indigo-800">
                            {etykietaRodzajuWydarzenia(ev.event_kind)}
                            {ev.nazwa_grupy ? ` · ${ev.nazwa_grupy}` : ""}
                          </p>
                          <p className="mt-1 font-medium text-stone-900">{ev.title}</p>
                          <p className="mt-2 text-xs text-stone-600">
                            {new Date(ev.starts_at).toLocaleString("pl-PL", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                            {ev.ends_at
                              ? ` – ${new Date(ev.ends_at).toLocaleTimeString("pl-PL", { timeStyle: "short" })}`
                              : null}
                            {ev.location_text ? ` · ${ev.location_text}` : ""}
                          </p>
                        </Link>
                        <a
                          href={`/api/wies/${wies.id}/wydarzenia/${ev.id}/ical`}
                          className="shrink-0 rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-xs text-green-900 hover:bg-stone-100"
                          download
                        >
                          Kalendarz (.ics)
                        </a>
                        {zalogowany ? (
                          <ZapiszTrescPrzycisk
                            villageId={wies.id}
                            contentType="event"
                            contentId={ev.id}
                            title={ev.title}
                            href={`${sciezka}/wydarzenia/${ev.id}`}
                            zapisaneId={zapisaneTresci[`event:${ev.id}`]}
                          />
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </OslonaSekcjiWies>
      ) : null}

      {mozeZobaczycListeZakupow ? (
        <OslonaSekcjiWies id="lista-zakupow-kgw">
          <TytulSekcjiWies
            etykieta="KGW"
            tytul="Lista zakupów KGW"
            opis="Wewnętrzna lista zakupów dla osób zapisanych do KGW oraz sołtysa."
          />
          <ListaZakupowWsiKlient
            villageId={wies.id}
            pozycje={listaZakupow}
            edytowalna={Boolean(mozeEdytowacListeZakupow)}
            pokazSzablony={Boolean(mozeEdytowacListeZakupow)}
            pokazDruk={listaZakupow.length > 0}
            nazwaWsi={wies.name}
          />
        </OslonaSekcjiWies>
      ) : null}

      {harmonogramTygodnia.length > 0 ? (
        <OslonaSekcjiWies>
          <TytulSekcjiWies
            etykieta="Harmonogram"
            tytul="Plan stałych zajęć (tydzień)"
            opis="Powtarzalne terminy (próby, zajęcia w świetlicy) — jednorazowe wydarzenia w kalendarzu wydarzeń."
          />
          <p className="mt-2 text-xs text-stone-600">
            <Link href={`${sciezka}/wydarzenia`} className="text-green-800 underline">
              Kalendarz wydarzeń
            </Link>
          </p>
          <ul className="mt-4 space-y-2">
            {harmonogramTygodnia.map((s) => (
              <li key={s.id} className={`${KARTA_LISTY_WIES} border-teal-200/70 bg-teal-50/30`}>
                <span className="font-medium text-teal-950">{nazwaDniaTygodnia(s.day_of_week)}</span>
                <span className="text-stone-700">
                  {" "}
                  {s.time_start.slice(0, 5)}
                  {s.time_end ? `–${s.time_end.slice(0, 5)}` : ""} — {s.title}
                  {s.nazwa_grupy ? ` · ${s.nazwa_grupy}` : ""}
                </span>
                {s.description ? <p className="mt-1 text-xs text-stone-600">{s.description}</p> : null}
              </li>
            ))}
          </ul>
        </OslonaSekcjiWies>
      ) : null}

      {dotacjeSkrot.length > 0 ? (
        <OslonaSekcjiWies id="sekcja-dotacje">
          <TytulSekcjiWies
            etykieta="Finansowanie"
            tytul="Możliwe źródła dofinansowania"
            opis="Informacje zebrane przez sołtysa — bez porady prawnej; zweryfikuj warunki u wnioskodawcy lub w BIP gminy."
          />
          <ul className="mt-4 space-y-2">
            {dotacjeSkrot.map((d) => (
              <li key={d.id}>
                <Link href={`${sciezka}/dotacje/${d.id}`} className={`${KARTA_LISTY_WIES} block border-emerald-200/80`}>
                  <p className="text-xs text-emerald-900">{etykietaKategoriiDotacji(d.category)}</p>
                  <p className="mt-1 font-medium text-stone-900">{d.title}</p>
                  {d.summary ? <p className="mt-1 line-clamp-2 text-xs text-stone-600">{d.summary}</p> : null}
                  {d.application_deadline ? (
                    <p className="mt-2 text-xs text-stone-500">
                      Termin naboru: {new Date(d.application_deadline).toLocaleDateString("pl-PL")}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-stone-500">
            <Link href={`${sciezka}/dotacje`} className="text-green-800 underline">
              Wszystkie zapisy o dofinansowaniu
            </Link>
          </p>
        </OslonaSekcjiWies>
      ) : null}

      {wiadomosci.length > 0 ? (
        <OslonaSekcjiWies id="sekcja-wiadomosci-lokalne">
          <TytulSekcjiWies
            etykieta="Aktualności"
            tytul="Lokalne wiadomości"
            opis={
              laczonyFeed.length > 0
                ? "Pełna lista wiadomości — skrót chronologiczny widać w sekcji „Najnowsze na wsi”."
                : "Krótkie aktualności o sprawach ważnych dla mieszkańców."
            }
          />
          <ul className="mt-4 space-y-2">
            {wiadomosci.map((w) => (
              <li key={w.id} id={`wiadomosc-lokalna-${w.id}`} className={KARTA_LISTY_WIES}>
                <p className="font-medium text-stone-900">{w.title}</p>
                {w.summary ? <p className="mt-1 text-sm text-stone-700">{w.summary}</p> : null}
                <p className="mt-2 text-xs text-stone-500">
                  {w.category ?? "aktualność"}
                  {w.source_name ? ` · źródło: ${w.source_name}` : ""}
                  {" · "}
                  {new Date(w.published_at ?? w.created_at).toLocaleDateString("pl-PL")}
                </p>
              </li>
            ))}
          </ul>
        </OslonaSekcjiWies>
      ) : null}

      <SwietliceWsiLazy
        nazwaWsi={wies.name}
        villageId={wies.id}
        isActive={wies.is_active}
        zalogowany={zalogowany}
      />

      <SekcjaDaneGeoWsiLazy villageId={wies.id} />

      <OslonaSekcjiWies id="swietlica-regulamin" className="from-stone-50/80 via-white to-stone-50/40">
        <TytulSekcjiWies etykieta="Regulamin" tytul="Świetlica i rezerwacje" />
        <p className="mt-3 text-sm text-stone-700">
          Rezerwacja sali odbywa się w{" "}
          <Link href={linkChroniony("/panel/mieszkaniec/swietlica", zalogowany)} className="text-green-800 underline">
            panelu mieszkańca
          </Link>{" "}
          (po akceptacji roli we wsi). Kto zajął salę w danym terminie — tylko sołtys w panelu obiegu; powyżej widać
          wyłącznie że przedział jest zajęty, bez danych osobowych.
        </p>
        {wies.teryt_id === "0088390" ? (
          <p className="mt-4 border-t border-stone-200 pt-4">
            <Link
              href={`${sciezka}/projekt-swietlicy`}
              className="inline-flex items-center gap-2 rounded-lg bg-green-800 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800"
            >
              Zobacz projekt świetlicy (rzut, elewacje, powierzchnie)
            </Link>
          </p>
        ) : null}
      </OslonaSekcjiWies>
    </article>
  );
}
