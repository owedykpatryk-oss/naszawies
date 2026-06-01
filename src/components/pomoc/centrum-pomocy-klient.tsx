"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { PrzewodnikKrokow } from "@/components/pomoc/przewodnik-krokow";
import { MapaGdzieCoKlient } from "@/components/pomoc/mapa-gdzie-co-klient";
import { ETYKIETA_ROLI, PRZEWODNIKI, type RolaPrzewodnika } from "@/lib/pomoc/przewodniki";

const ROLE: RolaPrzewodnika[] = ["ogolne", "mieszkaniec", "soltys", "kgw", "osp", "mysliwi"];

type Props = {
  rola: RolaPrzewodnika;
  pokazLinkSoltys?: boolean;
};

export function CentrumPomocyKlient({ rola, pokazLinkSoltys }: Props) {
  const sekcje = useMemo(() => PRZEWODNIKI[rola] ?? PRZEWODNIKI.ogolne, [rola]);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [rola]);

  return (
    <div>
      <nav
        className="no-print flex flex-wrap gap-2 rounded-2xl border border-stone-200/90 bg-white p-2 shadow-sm"
        aria-label="Rodzaj przewodnika"
      >
        {ROLE.map((r) => (
          <Link
            key={r}
            href={`/pomoc?rola=${r}`}
            className={
              rola === r
                ? "rounded-xl bg-green-800 px-3 py-2 text-sm font-medium text-white"
                : "rounded-xl px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
            }
          >
            {ETYKIETA_ROLI[r]}
          </Link>
        ))}
      </nav>

      {pokazLinkSoltys && rola !== "soltys" ? (
        <p className="mt-4 rounded-lg border border-green-200/80 bg-green-50/50 p-3 text-sm text-green-950">
          Jesteś sołtysem?{" "}
          <Link href="/pomoc?rola=soltys" className="font-medium underline">
            Przejdź do przewodnika sołtysa
          </Link>{" "}
          lub{" "}
          <Link href="/panel/soltys/pomoc" className="font-medium underline">
            panel pomocy
          </Link>
          .
        </p>
      ) : null}

      <div className="mt-8">
        <PrzewodnikKrokow sekcje={sekcje} />
      </div>

      <div className="mt-10">
        <MapaGdzieCoKlient
          domyslnyFiltr={rola === "soltys" ? "soltys" : rola === "mieszkaniec" ? "mieszkaniec" : "wszystkie"}
        />
      </div>

      <section className="mt-10 rounded-2xl border border-stone-200 bg-stone-50/80 p-5">
        <h2 className="font-serif text-lg text-green-950">Potrzebujesz wsparcia?</h2>
        <ul className="mt-3 space-y-2 text-sm text-stone-700">
          <li>
            <Link href="/zglos-problem-strony" className="font-medium text-green-800 underline">
              Zgłoś problem ze stroną
            </Link>{" "}
            — błąd techniczny, logowanie, panel.
          </li>
          <li>
            <Link href="/kontakt" className="font-medium text-green-800 underline">
              Kontakt
            </Link>{" "}
            — pytania ogólne, RODO.
          </li>
          <li>
            <Link href="/zglos-naruszenie" className="font-medium text-green-800 underline">
              Zgłoś naruszenie treści
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
