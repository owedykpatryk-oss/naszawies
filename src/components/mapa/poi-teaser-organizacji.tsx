import Link from "next/link";
import type { PodgladOrganizacjiPoi } from "@/lib/mapa/pobierz-organizacje-dla-poi";
import { etykietaLinkuOrganizacjiDlaPoi } from "@/lib/mapa/powiazanie-poi-organizacja";

const MOTYW: Record<PodgladOrganizacjiPoi["segment"], { ramka: string; naglowek: string; przycisk: string }> = {
  parafia: {
    ramka: "border-violet-200/80 bg-gradient-to-br from-violet-50/90 to-white",
    naglowek: "text-violet-950",
    przycisk: "bg-violet-800 hover:bg-violet-900",
  },
  szkola: {
    ramka: "border-sky-200/80 bg-gradient-to-br from-sky-50/90 to-white",
    naglowek: "text-sky-950",
    przycisk: "bg-sky-800 hover:bg-sky-900",
  },
  osp: {
    ramka: "border-red-200/80 bg-gradient-to-br from-red-50/90 to-white",
    naglowek: "text-red-950",
    przycisk: "bg-red-800 hover:bg-red-900",
  },
  kgw: {
    ramka: "border-rose-200/80 bg-gradient-to-br from-rose-50/90 to-white",
    naglowek: "text-rose-950",
    przycisk: "bg-rose-800 hover:bg-rose-900",
  },
  sport: {
    ramka: "border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 to-white",
    naglowek: "text-emerald-950",
    przycisk: "bg-emerald-800 hover:bg-emerald-900",
  },
  rolnicy: {
    ramka: "border-lime-200/80 bg-gradient-to-br from-lime-50/90 to-white",
    naglowek: "text-lime-950",
    przycisk: "bg-lime-800 hover:bg-lime-900",
  },
  lowiectwo: {
    ramka: "border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white",
    naglowek: "text-amber-950",
    przycisk: "bg-amber-800 hover:bg-amber-900",
  },
};

export function PoiTeaserOrganizacji({
  organizacja,
  kategoria,
}: {
  organizacja: PodgladOrganizacjiPoi;
  kategoria: string;
}) {
  const motyw = MOTYW[organizacja.segment];
  const etykieta = etykietaLinkuOrganizacjiDlaPoi(kategoria) ?? "Profil organizacji";

  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${motyw.ramka}`}
      aria-labelledby="poi-organizacja-tytul"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Organizacja przy tym miejscu</p>
      <h2 id="poi-organizacja-tytul" className={`mt-1 font-serif text-xl ${motyw.naglowek}`}>
        {organizacja.nazwa}
      </h2>
      {organizacja.podtytul ? <p className="mt-1 text-sm text-stone-700">{organizacja.podtytul}</p> : null}
      {organizacja.opisKrotki ? (
        <p className="mt-2 text-sm leading-relaxed text-stone-600">{organizacja.opisKrotki}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href={organizacja.linkProfilu}
          className={`inline-block rounded-lg px-4 py-2 text-sm font-medium text-white ${motyw.przycisk}`}
        >
          {etykieta} →
        </Link>
        {organizacja.telefon ? (
          <a href={`tel:${organizacja.telefon.replace(/\s/g, "")}`} className="text-sm font-medium text-green-800 underline">
            {organizacja.telefon}
          </a>
        ) : null}
      </div>
      <p className="mt-3 text-xs text-stone-500">
        Msze, wydarzenia, historia kadencji i pełny kontakt — na profilu organizacji. Zdjęcie i komentarze zostają tutaj, przy
        pinezce na mapie.
      </p>
    </section>
  );
}

export function PoiBrakOrganizacjiPodpowiedz({
  kategoria,
  sciezkaPanelu,
}: {
  kategoria: string;
  sciezkaPanelu?: string | null;
}) {
  const etykieta = etykietaLinkuOrganizacjiDlaPoi(kategoria);
  if (!etykieta) return null;

  return (
    <section className="rounded-2xl border border-dashed border-amber-300/80 bg-amber-50/50 p-5 sm:p-6">
      <h2 className="font-serif text-lg text-amber-950">Pełny profil — do uzupełnienia</h2>
      <p className="mt-2 text-sm leading-relaxed text-stone-700">
        Ta pinezka to lokalizacja na mapie (zdjęcie, komentarze, telefon). Aby dodać msze, historię, zarząd i wydarzenia,
        sołtys tworzy <strong>{etykieta.toLowerCase()}</strong> w panelu Społeczność — wtedy pojawi się link stąd.
      </p>
      {sciezkaPanelu ? (
        <p className="mt-3 text-sm">
          <Link href={sciezkaPanelu} className="font-medium text-green-800 underline">
            Panel sołtysa → Społeczność
          </Link>
        </p>
      ) : null}
    </section>
  );
}
