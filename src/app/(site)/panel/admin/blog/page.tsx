import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NaglowekModuluPanelu } from "@/components/pomoc/naglowek-modulu-panelu";
import { czyAdminPlatformy } from "@/lib/admin/czy-admin-platformy";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzWszystkieArtykulyAdmin } from "@/lib/blog/wczytaj-tresci";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export const metadata: Metadata = {
  title: "Blog — administracja",
};

export default async function AdminBlogPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  await pobierzUzytkownikaPanelu();

  if (!(await czyAdminPlatformy(supabase))) {
    redirect("/panel");
  }

  const artykuly = pobierzWszystkieArtykulyAdmin();

  return (
    <main>
      <NaglowekModuluPanelu
        etykieta="Blog platformy"
        tytul="Artykuły redakcyjne"
        opis={
          <>
            Treści w katalogu <code className="text-xs">content/blog/</code>. Edycja plików JSON + redeploy.
            Podgląd publiczny otwiera się w nowej karcie.{" "}
            <Link href="/panel/admin" className="font-medium text-green-800 underline">
              ← Panel admina
            </Link>
          </>
        }
      />

      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Tytuł</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Kategoria</th>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {artykuly.map((a) => (
              <tr key={a.slug} className="hover:bg-stone-50/80">
                <td className="px-4 py-3 font-medium text-stone-900">{a.title}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      a.status === "published"
                        ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-900"
                        : "rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900"
                    }
                  >
                    {a.status === "published" ? "opublikowany" : "szkic"}
                  </span>
                </td>
                <td className="px-4 py-3 text-stone-600">{a.category.name}</td>
                <td className="px-4 py-3 text-stone-600">
                  {new Date(a.publishedAt).toLocaleDateString("pl-PL")}
                </td>
                <td className="px-4 py-3">
                  {a.status === "published" ? (
                    <Link
                      href={`/blog/${a.slug}`}
                      target="_blank"
                      className="font-medium text-green-800 underline"
                    >
                      Podgląd
                    </Link>
                  ) : (
                    <span className="text-stone-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-sm text-stone-600">
        Przyszły etap: synchronizacja z Payload CMS lub tabelami{" "}
        <code className="text-xs">platform_blog_*</code> w Supabase (migracja przygotowana).
      </p>
    </main>
  );
}
