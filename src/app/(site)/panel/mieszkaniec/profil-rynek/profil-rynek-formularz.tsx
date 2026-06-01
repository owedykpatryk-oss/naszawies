"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ETYKIETY_RODZAJU_PROFILU, RODZAJE_PROFILU_RYNKU, type RodzajProfiluRynku } from "@/lib/marketplace/rodzaj-profilu-rynku";
import { zapiszProfilUslugodawcyMieszkanca } from "./akcje";

type ProfilPoczatek = {
  villageId: string;
  profile_kind: RodzajProfiluRynku;
  business_name: string;
  short_description: string;
  details: string;
  phone: string;
  email: string;
  website: string;
  categories_csv: string;
  service_area: string;
  is_verified: boolean;
};

export function ProfilRynekFormularz({
  wsie,
  profil,
}: {
  wsie: { id: string; name: string }[];
  profil: ProfilPoczatek | null;
}) {
  const router = useRouter();
  const [blad, ustawBlad] = useState("");
  const [czek, startT] = useTransition();

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    ustawBlad("");
    const fd = new FormData(e.currentTarget);
    startT(async () => {
      const w = await zapiszProfilUslugodawcyMieszkanca({
        villageId: String(fd.get("village_id")),
        profile_kind: String(fd.get("profile_kind")) as RodzajProfiluRynku,
        business_name: String(fd.get("business_name")),
        short_description: String(fd.get("short_description") || "") || null,
        details: String(fd.get("details") || "") || null,
        phone: String(fd.get("phone") || "") || null,
        email: String(fd.get("email") || "") || null,
        website: String(fd.get("website") || "") || null,
        categories_csv: String(fd.get("categories_csv") || ""),
        service_area: String(fd.get("service_area") || "") || null,
      });
      if ("blad" in w) {
        ustawBlad(w.blad);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-xl border border-stone-200 bg-white p-5">
      {profil?.is_verified ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          ✓ Profil zweryfikowany przez sołtysa — widoczny badge na profilu wsi.
        </p>
      ) : null}
      {blad ? <p className="text-sm text-red-800">{blad}</p> : null}
      <label className="block text-sm">
        Wieś
        <select name="village_id" required defaultValue={profil?.villageId ?? wsie[0]?.id} className="mt-1 block w-full">
          {wsie.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Rodzaj profilu
        <select
          name="profile_kind"
          required
          defaultValue={profil?.profile_kind ?? "firma"}
          className="mt-1 block w-full"
        >
          {RODZAJE_PROFILU_RYNKU.map((k) => (
            <option key={k} value={k}>
              {ETYKIETY_RODZAJU_PROFILU[k]}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Nazwa (gospodarstwo, firma, KGW)
        <input name="business_name" required minLength={2} defaultValue={profil?.business_name ?? ""} className="mt-1 block w-full" />
      </label>
      <label className="block text-sm">
        Krótki opis
        <textarea name="short_description" rows={2} defaultValue={profil?.short_description ?? ""} className="mt-1 block w-full" />
      </label>
      <label className="block text-sm">
        Szczegóły
        <textarea name="details" rows={4} defaultValue={profil?.details ?? ""} className="mt-1 block w-full" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Telefon
          <input name="phone" defaultValue={profil?.phone ?? ""} className="mt-1 block w-full" />
        </label>
        <label className="text-sm">
          E-mail
          <input name="email" type="email" defaultValue={profil?.email ?? ""} className="mt-1 block w-full" />
        </label>
      </div>
      <label className="block text-sm">
        Strona WWW
        <input name="website" defaultValue={profil?.website ?? ""} className="mt-1 block w-full" />
      </label>
      <label className="block text-sm">
        Kategorie (po przecinku)
        <input name="categories_csv" placeholder="miód, sery, usługi" defaultValue={profil?.categories_csv ?? ""} className="mt-1 block w-full" />
      </label>
      <label className="block text-sm">
        Obsługiwany rejon
        <input name="service_area" defaultValue={profil?.service_area ?? ""} className="mt-1 block w-full" />
      </label>
      <button
        type="submit"
        disabled={czek}
        className="rounded-xl bg-green-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-50"
      >
        {czek ? "Zapisywanie…" : "Zapisz profil firmy"}
      </button>
    </form>
  );
}
