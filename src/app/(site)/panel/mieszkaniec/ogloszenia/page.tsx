import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

export const metadata: Metadata = {
  title: "Ogłoszenia (mieszkaniec)",
};

export default async function MieszkaniecOgloszeniaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/mieszkaniec/ogloszenia");
  }

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
    })
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
      <h1 className="tytul-sekcji-panelu">Ogłoszenia</h1>
      <p className="mt-2 text-sm text-stone-600">
        Posty z wiosek, w których masz <strong>aktywną</strong> rolę mieszkańca.
      </p>

      {ids.length === 0 ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Nie masz jeszcze aktywnej roli mieszkańca.{" "}
          <Link href="/panel/mieszkaniec" className="font-medium underline">
            Złóż wniosek
          </Link>
          .
        </p>
      ) : null}

      {ids.length > 0 && posty.length === 0 ? (
        <p className="mt-8 text-sm text-stone-600">Brak widocznych postów — dodadzą je sołtysi lub mieszkańcy po moderacji.</p>
      ) : null}

      <ul className="mt-8 space-y-3">
        {posty.map((p) => {
          const v = pojedynczaWies<{
            slug: string;
            voivodeship: string;
            county: string;
            commune: string;
          }>(p.villages);
          const hrefPubliczny =
            v != null
              ? `${sciezkaProfiluWsi(v)}/ogloszenie/${p.id}`
              : null;
          return (
            <li
              key={p.id}
              className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
            >
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
