import Link from "next/link";
import { Suspense } from "react";
import { PrzewodnikModuluLeniwy } from "@/components/pomoc/przewodnik-modulu-leniwy";
import { SoltysNawigacja } from "./soltys-nawigacja";

export default function SoltysLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="no-print mb-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-emerald-200/80 bg-emerald-50/40 px-3 py-2.5 text-xs text-stone-700">
        <span className="font-semibold text-emerald-900">Szybki rytm:</span>{" "}
        <Link href="/panel/soltys/grafika" className="font-medium text-green-800 underline">
          plakat w 3 zakładkach
        </Link>
        , potem{" "}
        <Link href="/panel/soltys/wiadomosci-lokalne" className="text-green-800 underline">
          wiadomości
        </Link>
        ,{" "}
        <Link href="/panel/soltys/rezerwacje" className="text-green-800 underline">
          rezerwacje
        </Link>
        . Tryb społeczności:{" "}
        <Link href="/panel/soltys/spolecznosc?tryb=ogolny" className="text-green-800 underline">
          ogólny
        </Link>
        {" / "}
        <Link href="/panel/soltys/spolecznosc?tryb=kgw" className="text-green-800 underline">
          KGW
        </Link>
        {" / "}
        <Link href="/panel/soltys/spolecznosc?tryb=osp" className="text-green-800 underline">
          OSP
        </Link>
        {" · "}
        <Link href="/panel/soltys#kolejka-pracy" className="font-medium text-green-800 underline">
          kolejka pracy
        </Link>
      </div>
      <Suspense
        fallback={
          <div className="no-print mb-8 h-24 animate-pulse rounded-2xl border border-stone-200/60 bg-stone-100/50" />
        }
      >
        <SoltysNawigacja />
      </Suspense>
      <Suspense fallback={null}>
        <PrzewodnikModuluLeniwy />
      </Suspense>
      {children}
    </div>
  );
}
