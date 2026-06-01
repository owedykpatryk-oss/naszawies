import Link from "next/link";
import { DzisiajWHistoriiBaner } from "@/components/wies/dzisiaj-w-historii-baner";
import { GaleriaZdjecHistorii } from "@/components/wies/galeria-zdjec-historii";
import { HistoriaLiniaCzasuKlient } from "@/components/wies/historia-linia-czasu-klient";
import { MapaHistoriaWsiEmbedded } from "@/components/wies/mapa-historia-wsi-embedded";
import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { PrzewinDoSekcjiKlient } from "@/components/wies/przewin-do-sekcji-klient";
import { QrKronikaHistoriiKlient } from "@/components/wies/qr-kronika-historii-klient";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";
import { UdostepnijHistorieWsiKlient } from "@/components/wies/udostepnij-historie-wsi-klient";
import { UjawnijPoPrzewinieciu } from "@/components/ui/ujawnij-po-przewinieciu";
import { znajdzWpisDzisiajWHistorii } from "@/lib/historia/dzisiaj-w-historii";
import { urlRssHistoriiWsi } from "@/lib/historia/rss-historii";
import { znacznikiHistoriiNaMapie } from "@/lib/historia/znaczniki-historii-na-mapie";
import type { WpisHistoriiPubliczny } from "@/lib/historia/typy-historii";

type Props = {
  wpisy: WpisHistoriiPubliczny[];
  sciezkaProfilu: string;
  nazwaWsi: string;
  villageId: string;
  zalogowany?: boolean;
  przewinPrzyWejsciu?: boolean;
};

const LIMIT_PROFIL = 8;

export function SekcjaHistoriaPubliczna({
  wpisy,
  sciezkaProfilu,
  nazwaWsi,
  villageId,
  zalogowany = false,
  przewinPrzyWejsciu = false,
}: Props) {
  if (wpisy.length === 0) return null;

  const pinezki = znacznikiHistoriiNaMapie(wpisy, villageId, nazwaWsi, sciezkaProfilu);
  const wyrozniony = wpisy.find((w) => w.is_featured) ?? wpisy[0];
  const dzisiaj = znajdzWpisDzisiajWHistorii(wpisy);
  const naProfilu = wpisy.slice(0, LIMIT_PROFIL);
  const maWiecej = wpisy.length > LIMIT_PROFIL;
  const rssUrl = urlRssHistoriiWsi(villageId);

  return (
    <OslonaSekcjiWies id="sekcja-historia" wariant="historia">
      <PrzewinDoSekcjiKlient id="sekcja-historia" wlacz={przewinPrzyWejsciu} />
      <TytulSekcjiWies
        etykieta="Kronika"
        tytul="Historia miejscowości"
        opis="Wspomnienia, zdjęcia archiwalne i miejsca, gdzie działy się ważne wydarzenia — dostępne dla każdego odwiedzającego profil wsi."
      />
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
        <Link href={`${sciezkaProfilu}/historia`} className="font-medium text-amber-900 underline">
          Pełna kronika ({wpisy.length})
        </Link>
        {pinezki.length > 0 ? (
          <a href="#mapa-historia-wsi" className="font-medium text-amber-900 underline">
            Mapa miejsc ({pinezki.length})
          </a>
        ) : null}
        <a href={rssUrl} className="font-medium text-amber-900 underline" title="Kanał RSS kroniki">
          RSS
        </a>
      </p>

      {dzisiaj ? <DzisiajWHistoriiBaner wpis={dzisiaj} sciezkaProfilu={sciezkaProfilu} /> : null}

      {wyrozniony?.is_featured ? (
        <Link
          href={`${sciezkaProfilu}/historia/${wyrozniony.id}`}
          className="mt-4 block rounded-xl border border-amber-400/60 bg-gradient-to-br from-amber-100/90 to-white p-4 shadow-sm hover:border-amber-500"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Wyróżniony wpis</p>
          <p className="mt-1 font-serif text-lg text-green-950">{wyrozniony.title}</p>
          {wyrozniony.short_description ? (
            <p className="mt-1 line-clamp-2 text-sm text-stone-600">{wyrozniony.short_description}</p>
          ) : null}
        </Link>
      ) : null}

      <UdostepnijHistorieWsiKlient sciezkaProfilu={sciezkaProfilu} nazwaWsi={nazwaWsi} />

      {zalogowany ? (
        <p className="mt-3 text-sm text-stone-600">
          Masz wspomnienie lub archiwalne zdjęcie?{" "}
          <Link href="/panel/mieszkaniec/historia" className="font-medium text-green-800 underline">
            Zgłoś wspomnienie
          </Link>{" "}
          — sołtys opublikuje je po akceptacji.
        </p>
      ) : (
        <p className="mt-3 text-sm text-stone-600">
          <Link href="/logowanie" className="font-medium text-green-800 underline">
            Zaloguj się
          </Link>
          , aby zgłosić wspomnienie do kroniki.
        </p>
      )}

      <UjawnijPoPrzewinieciu>
        {pinezki.length > 0 ? (
          <div id="mapa-historia-wsi" className="scroll-mt-28">
            <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-amber-900/80">
              Gdzie to się działo
            </h3>
            <MapaHistoriaWsiEmbedded pinezki={pinezki} />
          </div>
        ) : null}

        <h3 className="mt-6 text-xs font-semibold uppercase tracking-wide text-stone-500">Oś czasu</h3>
        <HistoriaLiniaCzasuKlient wpisy={naProfilu} sciezkaProfilu={sciezkaProfilu} />

        {maWiecej ? (
          <p className="mt-5 text-center">
            <Link
              href={`${sciezkaProfilu}/historia`}
              className="inline-flex min-h-11 items-center rounded-full border border-amber-300/80 bg-amber-50/80 px-5 text-sm font-medium text-amber-950 hover:bg-amber-100/90"
            >
              Zobacz wszystkie wpisy ({wpisy.length})
            </Link>
          </p>
        ) : null}

        <div className="mt-8">
          <QrKronikaHistoriiKlient nazwaWsi={nazwaWsi} sciezkaProfilu={sciezkaProfilu} />
        </div>
      </UjawnijPoPrzewinieciu>
    </OslonaSekcjiWies>
  );
}

/** Podgląd galerii na stronie szczegółów (server). */
export function HistoriaSzczegolyMedia({ wpis }: { wpis: WpisHistoriiPubliczny }) {
  return (
    <>
      <GaleriaZdjecHistorii urls={wpis.media_urls} tytul={wpis.title} />
      {wpis.location_label ? (
        <p className="mt-3 text-sm text-stone-600">
          <span className="font-medium text-stone-700">Miejsce:</span> {wpis.location_label}
          {wpis.latitude != null && wpis.longitude != null ? (
            <>
              {" "}
              ·{" "}
              <a
                href={`https://www.openstreetmap.org/?mlat=${wpis.latitude}&mlon=${wpis.longitude}&zoom=16`}
                className="text-green-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Mapa OSM ↗
              </a>
            </>
          ) : null}
        </p>
      ) : null}
      {wpis.source_links.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm">
          <li className="text-xs font-semibold uppercase tracking-wide text-stone-500">Źródła</li>
          {wpis.source_links.map((url) => (
            <li key={url}>
              <a href={url} className="text-green-800 underline break-all" target="_blank" rel="noopener noreferrer">
                {url}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
