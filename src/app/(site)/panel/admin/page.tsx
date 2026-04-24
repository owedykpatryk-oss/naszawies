import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { AdminNowaWiesKlient } from "./admin-nowa-wies-klient";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/admin");
  }

  const { data: wpisy, error } = await supabase
    .from("waitlist")
    .select("id, email, full_name, village_name, commune, role, created_at")
    .order("created_at", { ascending: false })
    .limit(80);

  const brakDostepu =
    error &&
    (error.message.toLowerCase().includes("permission") ||
      error.message.toLowerCase().includes("policy") ||
      error.code === "42501" ||
      error.code === "PGRST301");

  return (
    <main>
      <h1 className="font-serif text-3xl text-green-950">Administrator platformy</h1>
      <p className="mt-2 text-sm text-stone-600">
        Tylko konta wskazane jako administrator platformy w Supabase (e-mail w migracji) widzą tę stronę i poniższe
        narzędzia.
      </p>

      {brakDostepu ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Brak uprawnień do odczytu waitlist — dodaj swój adres e-mail do listy adminów w migracji SQL lub skonfiguruj
          RLS.
        </p>
      ) : null}

      {!brakDostepu && (wpisy?.length ?? 0) === 0 ? (
        <p className="mt-8 text-sm text-stone-600">
          Lista jest pusta — albo nikt się jeszcze nie zapisał, albo (przy braku roli admina w Supabase) RLS zwraca zero
          wierszy.
        </p>
      ) : null}

      {!brakDostepu && (wpisy?.length ?? 0) ? (
        <div className="mt-8 max-w-full overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
          <table className="min-w-[32rem] text-left text-sm sm:min-w-full">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-600">
              <tr>
                <th className="px-2 py-2 sm:px-3">Data</th>
                <th className="px-2 py-2 sm:px-3">E-mail</th>
                <th className="px-2 py-2 sm:px-3">Imię</th>
                <th className="px-2 py-2 sm:px-3">Wieś</th>
                <th className="px-2 py-2 sm:px-3">Rola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(wpisy ?? []).map((w) => (
                <tr key={w.id}>
                  <td className="whitespace-nowrap px-2 py-2 text-stone-600 sm:px-3">
                    {new Date(w.created_at).toLocaleDateString("pl-PL")}
                  </td>
                  <td className="max-w-[10rem] break-all px-2 py-2 font-mono text-xs sm:max-w-none sm:break-normal sm:px-3">
                    {w.email}
                  </td>
                  <td className="px-2 py-2 sm:px-3">{w.full_name ?? "—"}</td>
                  <td className="max-w-[8rem] break-words px-2 py-2 sm:max-w-none sm:px-3">{w.village_name ?? "—"}</td>
                  <td className="whitespace-nowrap px-2 py-2 sm:px-3">{w.role ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!brakDostepu ? <AdminNowaWiesKlient /> : null}

      <p className="mt-10 text-sm text-stone-500">
        <Link href="/panel" className="text-green-800 underline">
          ← Start panelu
        </Link>
      </p>
    </main>
  );
}
