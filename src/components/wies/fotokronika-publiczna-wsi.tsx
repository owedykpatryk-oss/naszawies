import Link from "next/link";
import { OslonaSekcjiWies } from "@/components/wies/oslona-sekcji-wies";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";
import type { ZdjeciePubliczne } from "@/lib/fotokronika/pobierz-fotokronike-publiczna";

type Props = {
  zdjecia: ZdjeciePubliczne[];
  nazwaWsi: string;
  pokazLinkDodaj?: boolean;
};

export function FotokronikaPublicznaWsi({ zdjecia, nazwaWsi, pokazLinkDodaj = true }: Props) {
  if (zdjecia.length === 0) return null;

  return (
    <OslonaSekcjiWies id="fotokronika-wsi">
      <TytulSekcjiWies
        etykieta="Fotokronika"
        tytul="Zdjęcia z życia wsi"
        opis={`Chronika społeczności ${nazwaWsi} — zdjęcia dodane przez mieszkańców i zatwierdzone przez sołtysa.`}
      />
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {zdjecia.map((z) => (
          <li key={z.id} className="karta-wow group overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={z.url}
              alt={z.caption ?? "Zdjęcie z fotokroniki"}
              className="aspect-square w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
            {z.caption ? (
              <p className="line-clamp-2 px-2 py-1.5 text-xs text-stone-600">{z.caption}</p>
            ) : null}
          </li>
        ))}
      </ul>
      {pokazLinkDodaj ? (
        <p className="mt-3 text-sm text-stone-600">
          Masz zdjęcie z wydarzenia?{" "}
          <Link href="/panel/mieszkaniec/fotokronika" className="font-medium text-green-800 underline">
            Dodaj do fotokroniki
          </Link>{" "}
          (wymaga konta mieszkańca).
        </p>
      ) : null}
    </OslonaSekcjiWies>
  );
}
