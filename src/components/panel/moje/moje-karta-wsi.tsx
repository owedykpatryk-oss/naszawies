import Link from "next/link";
import type { WiesPowiazana } from "@/lib/panel/pobierz-moje-powiazania";

function klasyStatusu(status: string | null): string {
  if (status === "active") return "border-emerald-300 bg-emerald-50 text-emerald-900";
  if (status === "pending") return "border-amber-300 bg-amber-50 text-amber-900";
  if (status === "suspended") return "border-rose-300 bg-rose-50 text-rose-900";
  return "border-stone-300 bg-stone-50 text-stone-700";
}

export function MojeKartaWsi({ wies, kompakt = false }: { wies: WiesPowiazana; kompakt?: boolean }) {
  return (
    <article className="karta-wow rounded-xl border border-stone-200/90 bg-white p-4 shadow-sm ring-1 ring-stone-900/[0.02]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link href={wies.sciezkaProfilu} className="font-serif text-lg text-green-950 hover:underline">
            {wies.nazwa}
          </Link>
          <p className="mt-0.5 text-xs text-stone-500">
            {wies.gmina} · pow. {wies.powiat} · {wies.wojewodztwo}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {wies.etykietaRoli ? (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${klasyStatusu(wies.statusRoli)}`}>
              {wies.etykietaRoli}
              {wies.statusRoli && wies.statusRoli !== "active" ? ` · ${wies.statusRoli}` : ""}
            </span>
          ) : null}
          {wies.followId ? (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-900">
              Obserwujesz
            </span>
          ) : null}
        </div>
      </div>

      {!kompakt ? (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Link
            href={`${wies.sciezkaProfilu}#informacje-mieszkancow`}
            className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-900 ring-1 ring-emerald-200/60 hover:bg-emerald-100"
          >
            Informacje lokalne
          </Link>
          <Link
            href={`${wies.sciezkaProfilu}#sekcja-aktualnosci-laczone`}
            className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-800 ring-1 ring-stone-200/80 hover:bg-stone-200/60"
          >
            Aktualności
          </Link>
          {wies.statusRoli === "active" ? (
            <>
              <Link href="/panel/mieszkaniec/ogloszenia" className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-800 ring-1 ring-stone-200/80">
                Ogłoszenia
              </Link>
              <Link href="/panel/mieszkaniec/swietlica" className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-800 ring-1 ring-stone-200/80">
                Świetlica
              </Link>
            </>
          ) : null}
          <Link href={wies.sciezkaGminy} className="rounded-full bg-stone-100 px-2.5 py-1 font-medium text-stone-800 ring-1 ring-stone-200/80">
            Gmina
          </Link>
        </div>
      ) : null}
    </article>
  );
}
