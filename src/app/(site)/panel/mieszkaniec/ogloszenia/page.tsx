import type { Metadata } from "next";
import Link from "next/link";

import { NaglowekModuluMieszkaniec } from "@/components/pomoc/naglowek-modulu-panelu";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

export const metadata: Metadata = {
  title: "Ogłoszenia (mieszkaniec)",
};

export default async function MieszkaniecOgloszeniaPage() {
  const user = await pobierzUzytkownikaPanelu();
  const supabase = utworzKlientaSupabaseSerwer();

  const { data: aktywne } = await supabase
    .from("user_village_roles")
    .select("village_id, villages(name)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .eq("role", "mieszkaniec");

  const ids = (aktywne ?? []).map((r) => r.village_id).filter(Boolean);
  const nazwy = Object.fromEntries(
    (aktywne ?? []).map((r) => {
      const v = pojedynczaWies<{ name: string }>(r.villages);
      return [r.village_id, v?.name ?? "Wieś"];
    }),
  );

  type WpisPostu = {
    id: string;
    title: string;
    type: string;
    status: string;
    created_at: string;
    village_id: string;
    villages: unknown;
  };
  let posty: WpisPostu[] = [];
  if (ids.length > 0) {
    const { data } = await supabase
      .from("posts")
      .select("id, title, type, status, created_at, village_id, villages (slug, voivodeship, county, commune)")
      .in("village_id", ids)
      .order("created_at", { ascending: false })
      .limit(40);
    posty = (data ?? []) as WpisPostu[];
  }

  return (
    <main>
      <NaglowekModuluMieszkaniec
        tytul="Ogłoszenia"
        opis={
          <>
            Posty z wiosek, w których masz <strong>aktywną</strong> rolę mieszkańca.
          </>
        }
        hrefPomocy="/panel/mieszkaniec/pomoc"
      />

      {ids.length === 0 ? (
        <p className="pusty-stan-panelu mt-8">
          Nie masz jeszcze aktywnej roli mieszkańca.{" "}
          <Link href="/panel/mieszkaniec" className="font-medium underline">
            Złóż wniosek
          </Link>
          .
        </p>
      ) : null}

      {ids.length > 0 && posty.length === 0 ? (
        <p className="mt-8 text-sm text-stone-600">
          Brak widocznych postów — dodadzą je sołtysi lub mieszkańcy po moderacji.
        </p>
      ) : null}

      <ul className="lista-wierszy-panelu mt-8">
        {posty.map((p) => {
          const v = pojedynczaWies<{
            slug: string;
            voivodeship: string;
            county: string;
            commune: string;
          }>(p.villages);
          const hrefPubliczny = v != null ? `${sciezkaProfiluWsi(v)}/ogloszenie/${p.id}` : null;
          return (
            <li key={p.id}>
              {hrefPubliczny ? (
                <Link href={hrefPubliczny} className="font-medium text-green-900 underline hover:text-green-950">
                  {p.title}
                </Link>
              ) : (
                <p className="font-medium text-stone-900">{p.title}</p>
              )}
              <p className="text-xs text-stone-500">
                {nazwy[p.village_id] ?? "Wieś"} · {p.type} · {p.status} ·{" "}
                {new Date(p.created_at).toLocaleDateString("pl-PL")}
              </p>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
