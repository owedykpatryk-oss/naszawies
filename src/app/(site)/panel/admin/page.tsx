import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

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
        Dostęp do listy waitlist wg funkcji <code className="rounded bg-stone-100 px-1 text-xs">is_platform_admin()</code>{" "}
        w Supabase (e-mail w migracji).
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
        <div className="mt-8 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-600">
              <tr>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">E-mail</th>
                <th className="px-3 py-2">Imię</th>
                <th className="px-3 py-2">Wieś</th>
                <th className="px-3 py-2">Rola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {(wpisy ?? []).map((w) => (
                <tr key={w.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-stone-600">
                    {new Date(w.created_at).toLocaleDateString("pl-PL")}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{w.email}</td>
                  <td className="px-3 py-2">{w.full_name ?? "—"}</td>
                  <td className="px-3 py-2">{w.village_name ?? "—"}</td>
                  <td className="px-3 py-2">{w.role ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="mt-10 text-sm text-stone-500">
        <Link href="/panel" className="text-green-800 underline">
          ← Start panelu
        </Link>
      </p>
    </main>
  );
}
