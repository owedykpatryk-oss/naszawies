type Props = {
  liczbaMieszkancow: number;
  liczbaOgloszen: number;
  liczbaAktualnosci: number;
  aktywnyProfil: boolean;
};

export function SpolecznyDowodWsi({
  liczbaMieszkancow,
  liczbaOgloszen,
  liczbaAktualnosci,
  aktywnyProfil,
}: Props) {
  const maDane = liczbaMieszkancow > 0 || liczbaOgloszen > 0 || liczbaAktualnosci > 0 || aktywnyProfil;
  if (!maDane) return null;

  return (
    <ul className="mt-3 flex flex-wrap gap-2 text-[11px] font-medium">
      {aktywnyProfil ? (
        <li className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-900 ring-1 ring-emerald-200/80">
          Aktywna społeczność online
        </li>
      ) : null}
      {liczbaMieszkancow > 0 ? (
        <li className="rounded-full bg-stone-100 px-2.5 py-1 text-stone-800">
          {liczbaMieszkancow} {liczbaMieszkancow === 1 ? "mieszkaniec" : liczbaMieszkancow < 5 ? "mieszkańców" : "mieszkańców"} w serwisie
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
