import Link from "next/link";
import { GaleriaZdjecHistorii } from "@/components/wies/galeria-zdjec-historii";
import { WyswietlTrescBogata } from "@/components/ui/tresc-bogata";
import { UjawnijPoPrzewinieciu } from "@/components/ui/ujawnij-po-przewinieciu";
import { PoiGaleriaLightboxKlient } from "@/components/mapa/poi-galeria-lightbox-klient";
import type { WpisKronikiPoi } from "@/lib/mapa/pobierz-kronike-poi";
import type { ZdjecieProfiluPoi } from "@/lib/mapa/zdjecia-profilu-poi";

type Props = {
  historia: string | null;
  ciekawostki: string | null;
  galeria: ZdjecieProfiluPoi[];
  wpisyKroniki: WpisKronikiPoi[];
  sciezkaKronikiWsi: string;
};

function formatujDate(d: string | null): string | null {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("pl-PL", { year: "numeric", month: "long", day: "numeric" });
}

export function PoiProfilTrescPubliczna({ historia, ciekawostki, galeria, wpisyKroniki, sciezkaKronikiWsi }: Props) {
  const maHistorie = Boolean(historia?.trim());
  const maCiekawostki = Boolean(ciekawostki?.trim());
  const maGalerie = galeria.length > 0;
  const maKronike = wpisyKroniki.length > 0;

  if (!maHistorie && !maCiekawostki && !maGalerie && !maKronike) return null;

  return (
    <div className="poi-profil-tresci space-y-6">
      {maHistorie ? (
        <UjawnijPoPrzewinieciu as="section">
          <section className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-900/75">Historia miejsca</p>
            <h2 className="mt-1 font-serif text-xl text-amber-950">Opowieść o tym miejscu</h2>
            <div className="mt-4">
              <WyswietlTrescBogata tresc={historia!} />
            </div>
          </section>
        </UjawnijPoPrzewinieciu>
      ) : null}

      {maCiekawostki ? (
        <UjawnijPoPrzewinieciu as="section" opoznienieMs={80}>
          <section className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/60 via-white to-sky-50/30 p-5 shadow-sm sm:p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-800/80">Warto wiedzieć</p>
            <h2 className="mt-1 font-serif text-xl text-emerald-950">Ciekawostki i dane</h2>
            <div className="mt-4">
              <WyswietlTrescBogata tresc={ciekawostki!} />
            </div>
          </section>
        </UjawnijPoPrzewinieciu>
      ) : null}

      {maGalerie ? (
        <UjawnijPoPrzewinieciu as="section" opoznienieMs={120}>
          <section className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-serif text-lg text-green-950">Galeria zdjęć</h2>
            <PoiGaleriaLightboxKlient galeria={galeria} />
          </section>
        </UjawnijPoPrzewinieciu>
      ) : null}

      {maKronike ? (
        <UjawnijPoPrzewinieciu as="section" opoznienieMs={160}>
          <section className="rounded-2xl border border-amber-300/60 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-serif text-lg text-amber-950">Z kroniki wsi</h2>
              <Link href={`${sciezkaKronikiWsi}/historia`} className="text-xs font-medium text-amber-900 underline">
                Pełna kronika →
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {wpisyKroniki.map((w) => (
                <li key={w.id}>
                  <Link
                    href={w.sciezka}
                    className="block rounded-xl border border-amber-100 bg-amber-50/40 px-4 py-3 transition hover:border-amber-300"
                  >
                    <p className="font-medium text-green-950">{w.title}</p>
                    {w.era_label || w.event_date ? (
                      <p className="mt-0.5 text-xs text-stone-500">
                        {[w.era_label, formatujDate(w.event_date)].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                    {w.short_description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-stone-600">{w.short_description}</p>
                    ) : null}
                    {w.media_urls.length > 0 ? (
                      <div className="mt-2">
                        <GaleriaZdjecHistorii urls={w.media_urls} tytul={w.title} kompakt />
                      </div>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </UjawnijPoPrzewinieciu>
      ) : null}
    </div>
  );
}
