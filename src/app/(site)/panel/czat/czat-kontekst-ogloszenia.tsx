import Link from "next/link";
import { ObrazR2 } from "@/components/media/obraz-r2";
import { FormatujCeneOgloszenia } from "@/components/wies/rynek-ui";
import {
  etykietaKategoriiOgloszenia,
  etykietaTypuOgloszenia,
} from "@/lib/marketplace/kategorie-ogloszen";

export type KontekstOgloszeniaCzat = {
  id: string;
  title: string;
  listing_type: string;
  status: string;
  image_url: string | null;
  href: string;
  price_amount: number | null;
  price_unit: string | null;
  currency?: string | null;
  equipment_category: string | null;
  category: string | null;
};

const ETYKIETA_STATUS: Record<string, string> = {
  pending: "oczekuje na zatwierdzenie",
  rejected: "odrzucone",
  archived: "zarchiwizowane",
  draft: "szkic",
};

export function CzatKontekstOgloszenia({ ogloszenie }: { ogloszenie: KontekstOgloszeniaCzat }) {
  const nieaktywne = ogloszenie.status !== "approved";
  const kat = ogloszenie.equipment_category ?? ogloszenie.category;

  return (
    <Link
      href={ogloszenie.href}
      className="mt-4 flex gap-3 rounded-xl border border-orange-200/80 bg-gradient-to-r from-orange-50/80 to-white p-3 transition hover:border-orange-400 hover:shadow-sm"
    >
      {ogloszenie.image_url ? (
        <ObrazR2
          src={ogloszenie.image_url}
          preset="miniatura"
          alt=""
          className="h-16 w-16 shrink-0 rounded-lg object-cover"
        />
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
          {kat ? ` · ${etykietaKategoriiOgloszenia(kat)}` : ""}
        </p>
        <p className="mt-1 text-sm font-semibold text-green-900">
          <FormatujCeneOgloszenia
            kwota={ogloszenie.price_amount}
            jednostka={ogloszenie.price_unit}
            waluta={ogloszenie.currency}
          />
        </p>
        {nieaktywne ? (
          <p className="mt-1 text-xs font-medium text-amber-900">
            Ogłoszenie nieaktywne ({ETYKIETA_STATUS[ogloszenie.status] ?? ogloszenie.status})
          </p>
        ) : null}
        <p className="mt-1 text-xs font-medium text-green-800">Zobacz ogłoszenie →</p>
      </div>
    </Link>
  );
}
