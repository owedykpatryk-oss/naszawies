type Props = {
  liczbaMieszkancow: number;
  liczbaOgloszen: number;
  liczbaAktualnosci: number;
  aktywnyProfil: boolean;
  liczbaPoi?: number;
  maGranice?: boolean;
  liczbaHistorii?: number;
  liczbaZdjecKroniki?: number;
};

export function SpolecznyDowodWsi({
  liczbaMieszkancow,
  liczbaOgloszen,
  liczbaAktualnosci,
  aktywnyProfil,
  liczbaPoi = 0,
  maGranice = false,
  liczbaHistorii = 0,
  liczbaZdjecKroniki = 0,
}: Props) {
  const maDane =
    liczbaMieszkancow > 0 ||
    liczbaOgloszen > 0 ||
    liczbaAktualnosci > 0 ||
    aktywnyProfil ||
    liczbaPoi > 0 ||
    maGranice ||
    liczbaHistorii > 0 ||
    liczbaZdjecKroniki > 0;
  if (!maDane) return null;

  return (
    <ul className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium">
      {aktywnyProfil ? (
        <li className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-900 ring-1 ring-emerald-200/80">
          <span className="spolecznosc-puls" aria-hidden />
          Aktywna społeczność online
        </li>
      ) : null}
      {maGranice ? (
        <li className="rounded-full bg-teal-50 px-2.5 py-1 text-teal-900 ring-1 ring-teal-200/80">
          Granica wsi na mapie (PRG)
        </li>
      ) : null}
      {liczbaPoi > 0 ? (
        <li className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-950 ring-1 ring-emerald-200/70">
          {liczbaPoi} {liczbaPoi === 1 ? "miejsce" : liczbaPoi < 5 ? "miejsca" : "miejsc"} na mapie
        </li>
      ) : null}
      {liczbaHistorii > 0 ? (
        <li className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-950 ring-1 ring-amber-200/80">
          {liczbaHistorii} {liczbaHistorii === 1 ? "wpis" : "wpisy"} kroniki
        </li>
      ) : null}
      {liczbaZdjecKroniki > 0 ? (
        <li className="rounded-full bg-orange-50 px-2.5 py-1 text-orange-950 ring-1 ring-orange-200/70">
          {liczbaZdjecKroniki} zdj. w fotokronice
        </li>
      ) : null}
      {liczbaMieszkancow > 0 ? (
        <li className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-800">
          {liczbaMieszkancow} {liczbaMieszkancow === 1 ? "mieszkaniec" : "mieszkańców"} w serwisie
        </li>
      ) : null}
      {liczbaOgloszen > 0 ? (
        <li className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-950">
          {liczbaOgloszen} {liczbaOgloszen === 1 ? "ogłoszenie" : "ogłoszeń"} na rynku
        </li>
      ) : null}
      {liczbaAktualnosci > 0 ? (
        <li className="rounded-full bg-sky-100 px-2.5 py-1 text-sky-950">
          {liczbaAktualnosci}+ aktualności
        </li>
      ) : null}
    </ul>
  );
}
