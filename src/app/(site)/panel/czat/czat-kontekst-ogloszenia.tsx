import Link from "next/link";
import { etykietaTypuOgloszenia } from "@/lib/marketplace/kategorie-ogloszen";

export type KontekstOgloszeniaCzat = {
  id: string;
  title: string;
  listing_type: string;
  status: string;
  image_url: string | null;
  href: string;
};

export function CzatKontekstOgloszenia({ ogloszenie }: { ogloszenie: KontekstOgloszeniaCzat }) {
  const nieaktywne = ogloszenie.status !== "approved";

  return (
    <Link
      href={ogloszenie.href}
      className="mt-4 flex gap-3 rounded-xl border border-orange-200/80 bg-gradient-to-r from-orange-50/80 to-white p-3 transition hover:border-orange-400 hover:shadow-sm"
    >
      {ogloszenie.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ogloszenie.image_url} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-[10px] text-orange-800">
          Rynek
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-orange-900">Powiązane ogłoszenie</p>
        <p className="truncate font-medium text-stone-900">{ogloszenie.title}</p>
        <p className="mt-0.5 text-xs text-stone-600">
          {etykietaTypuOgloszenia(ogloszenie.listing_type)}
          {nieaktywne ? " · nieaktywne" : ""}
        </p>
        <p className="mt-1 text-xs font-medium text-green-800">Zobacz ogłoszenie →</p>
      </div>
    </Link>
  );
}
