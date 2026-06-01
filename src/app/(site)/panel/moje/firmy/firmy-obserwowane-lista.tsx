"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { przelaczObserwacjeProfiluRynku } from "@/lib/marketplace/obserwuj-profil-rynku";
import type { ObserwowanyProfilRynku } from "@/lib/marketplace/pobierz-obserwowane-profile";
import { etykietaRodzajuProfilu } from "@/lib/marketplace/rodzaj-profilu-rynku";

export function FirmyObserwowaneLista({ profile }: { profile: ObserwowanyProfilRynku[] }) {
  const router = useRouter();
  const [czek, startT] = useTransition();
  const [blad, ustawBlad] = useState("");

  function przestanObserwowac(profileId: string) {
    ustawBlad("");
    startT(async () => {
      const w = await przelaczObserwacjeProfiluRynku(profileId);
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      router.refresh();
    });
  }

  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-2">
      {profile.map((p) => (
        <li key={p.followId} className="panel-karta flex h-full flex-col">
          <p className="text-xs font-bold uppercase tracking-wide text-orange-900">
            {etykietaRodzajuProfilu(p.profile_kind)}
            {p.is_verified ? " · ✓ zweryfikowany" : ""}
          </p>
          <h2 className="mt-1 font-serif text-lg text-green-950">
            <Link href={p.sciezkaFirmy} className="hover:underline">
              {p.business_name}
            </Link>
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            <Link href={p.sciezkaProfilu} className="text-green-800 underline">
              {p.village_name}
            </Link>
            {" · "}
            {p.liczbaOfert} {p.liczbaOfert === 1 ? "oferta" : "ofert"}
          </p>
          {p.short_description ? (
            <p className="mt-2 line-clamp-2 flex-1 text-sm text-stone-600">{p.short_description}</p>
          ) : (
            <div className="flex-1" />
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={p.sciezkaFirmy}
              className="rounded-lg bg-green-800 px-3 py-2 text-sm font-medium text-white hover:bg-green-900"
            >
              Strona firmy
            </Link>
            <button
              type="button"
              disabled={czek}
              onClick={() => przestanObserwowac(p.profileId)}
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              Przestań obserwować
            </button>
          </div>
        </li>
      ))}
      {blad ? (
        <li className="sm:col-span-2">
          <p className="text-sm text-red-800" role="alert">
            {blad}
          </p>
        </li>
      ) : null}
    </ul>
  );
}
