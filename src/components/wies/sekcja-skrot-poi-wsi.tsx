import Link from "next/link";
import type { ZnacznikPoi } from "@/components/mapa/mapa-wsi-leaflet";
import { emojiKategoriiPoi, etykietaKategoriiPoi } from "@/lib/mapa/kategorie-poi";

const KATEGORIE_PRIORYTET = [
  "sklep",
  "szkola",
  "przedszkole",
  "kosciol",
  "osp",
  "przystanek",
  "stacja_kolejowa",
  "apteka",
  "przychodnia",
  "poczta",
  "stacja_paliw",
  "boisko",
  "swietlica",
  "biblioteka",
  "cmentarz",
  "gastronomia",
  "parking_publiczny",
  "paczkomat",
  "bankomat",
] as const;

type Props = {
  pois: ZnacznikPoi[];
  nazwaWsi: string;
};

export function SekcjaSkrotPoiWsi({ pois, nazwaWsi }: Props) {
  const poKategorii = new Map<string, ZnacznikPoi[]>();
  for (const p of pois) {
    const arr = poKategorii.get(p.category) ?? [];
    arr.push(p);
    poKategorii.set(p.category, arr);
  }

  const kategorie = [
    ...KATEGORIE_PRIORYTET.filter((k) => poKategorii.has(k)),
    ...Array.from(poKategorii.keys()).filter(
      (k) => !KATEGORIE_PRIORYTET.includes(k as (typeof KATEGORIE_PRIORYTET)[number]),
    ).sort(),
  ].slice(0, 12);

  if (kategorie.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-stone-200/90 bg-white/80 p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-stone-500">Miejsca w {nazwaWsi}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {kategorie.map((kat) => {
          const lista = poKategorii.get(kat) ?? [];
          const pierwszy = lista[0];
          return (
            <li key={kat}>
              <Link
                href={pierwszy ? `/mapa/miejsce/${pierwszy.id}` : "#sekcja-mapa"}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50/80 px-3 py-1.5 text-xs font-medium text-stone-800 transition hover:border-emerald-300 hover:bg-emerald-50"
                title={lista.map((p) => p.name).join(", ")}
              >
                <span aria-hidden>{emojiKategoriiPoi(kat)}</span>
                <span>{etykietaKategoriiPoi(kat)}</span>
                {lista.length > 1 ? (
                  <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] text-stone-500 ring-1 ring-stone-200">
                    {lista.length}
                  </span>
                ) : pierwszy ? (
                  <span className="max-w-[8rem] truncate text-[10px] font-normal text-stone-500">{pierwszy.name}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
