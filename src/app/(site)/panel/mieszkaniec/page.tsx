import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { MieszkaniecKlient } from "./mieszkaniec-klient";

export const metadata: Metadata = {
  title: "Panel mieszkańca",
};

export default async function MieszkaniecPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/mieszkaniec");
  }

  const { data: roleRows } = await supabase
    .from("user_village_roles")
    .select(
      "id, role, status, created_at, village_id, villages (name, slug, voivodeship, county, commune)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const roleList = (roleRows ?? []).map((r) => {
    const v = pojedynczaWies<{
      name: string;
      slug: string;
      voivodeship: string;
      county: string;
      commune: string;
    }>(r.villages);
    return {
      id: r.id,
      rola: r.role,
      status: r.status,
      created_at: r.created_at,
      wies: v?.name ?? "—",
      sciezkaWsi: v ? sciezkaProfiluWsi(v) : null,
    };
  });

  return (
    <main>
      <h1 className="font-serif text-3xl text-green-950">Mieszkaniec</h1>
      <p className="mt-2 text-sm text-stone-600">
        Twoje role we wsiach, wnioski i obserwowane miejscowości. Publiczny profil:{" "}
        <Link href={`/u/${user.id}`} className="font-medium text-green-800 underline">
          /u/{user.id.slice(0, 8)}…
        </Link>
      </p>

      <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Moje role we wsiach</h2>
        {roleList.length === 0 ? (
          <p className="mt-3 text-sm text-stone-600">Brak zapisów — złóż wniosek poniżej.</p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {roleList.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-stone-900">{r.wies}</p>
                  <p className="text-xs text-stone-600">
                    Rola: <strong>{r.rola}</strong> · status: <strong>{r.status}</strong>
                  </p>
                  {r.sciezkaWsi ? (
                    <Link href={r.sciezkaWsi} className="text-xs text-green-800 underline">
                      Profil wsi
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-10">
        <MieszkaniecKlient />
      </div>
    </main>
  );
}
