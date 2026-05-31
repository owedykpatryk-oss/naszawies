import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { AdminNowaWiesKlient } from "./admin-nowa-wies-klient";
import { AdminKolejkaSoltysowKlient } from "./admin-kolejka-soltysow-klient";
import type { WniosekAdminWiersz } from "@/lib/admin/typy-wniosek-soltysa";
import { czyAdminPlatformy } from "@/lib/admin/czy-admin-platformy";
import { pobierzJakoscKatalogu } from "@/lib/admin/pobierz-jakosc-katalogu";
import { pobierzKolejkeWnioskowSoltysaAdmin } from "@/lib/admin/pobierz-kolejke-wnioskow-soltysa";

export const metadata: Metadata = {
  title: "Admin",
};

export default async function AdminPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    redirect("/logowanie?next=/panel/admin");
  }

  if (!(await czyAdminPlatformy(supabase))) {
    redirect("/panel");
  }

  const wnioskiSoltys: WniosekAdminWiersz[] = await pobierzKolejkeWnioskowSoltysaAdmin();

  const [{ data: wpisy, error }, { data: cronWpisy, error: cronErr }, raportKatalogu] = await Promise.all([
    supabase
      .from("waitlist")
      .select("id, email, full_name, village_name, commune, role, created_at")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("cron_runs")
      .select("id, endpoint, started_at, finished_at, status, error_message, source_ip")
      .order("started_at", { ascending: false })
      .limit(50),
    pobierzJakoscKatalogu(supabase),
  ]);

  const cronBladTabeli =
    cronErr &&
    (cronErr.message.toLowerCase().includes("does not exist") ||
      cronErr.message.toLowerCase().includes("not find") ||
      cronErr.code === "42P01");

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
        Tylko wskazane konta administratora platformy widzą tę stronę i poniższe narzędzia.
      </p>

      {brakDostepu ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Brak uprawnień do tej listy. Skontaktuj się z administratorem serwisu.
        </p>
      ) : null}

      {!brakDostepu && (wpisy?.length ?? 0) === 0 ? (
        <p className="mt-8 text-sm text-stone-600">
          Lista jest pusta albo konto nie ma jeszcze uprawnień do odczytu wpisów.
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

      {!brakDostepu && raportKatalogu ? (
        <section className="mt-10 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-xl text-green-950">Jakość katalogu wsi</h2>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <li>
              Wszystkie wsie: <strong>{raportKatalogu.wszystkie}</strong>
            </li>
            <li>
              Aktywne profile: <strong>{raportKatalogu.aktywne}</strong>
            </li>
            <li>
              Z granicą mapy: <strong>{raportKatalogu.zGranica}</strong>
            </li>
            <li>
              Ze współrzędnymi: <strong>{raportKatalogu.zWspolrzednymi}</strong>
            </li>
            <li>
              Z przypisanym sołtysem: <strong>{raportKatalogu.zSoltysem}</strong>
            </li>
            <li className="text-amber-900">
              Bez granicy: <strong>{raportKatalogu.bezGranicy}</strong>
            </li>
            <li className="text-amber-900">
              Bez współrzędnych: <strong>{raportKatalogu.bezWspolrzednych}</strong>
            </li>
          </ul>
          <p className="mt-3 text-xs text-stone-500">
            Uzupełnianie: <code className="font-mono">npm run sync:granice</code>,{" "}
            <code className="font-mono">npm run automatyzuj:katalog</code>
          </p>
        </section>
      ) : null}

      {!brakDostepu ? (
        <section className="mt-10 rounded-xl border border-amber-200/80 bg-white p-5 shadow-sm">
          <h2 className="font-serif text-2xl text-green-950">Kolejka wniosków sołtysów</h2>
          <p className="mt-1 text-sm text-stone-600">
            Zatwierdzenie tworzy lub aktywuje wieś i nadaje rolę sołtysa (trigger aktywacji profilu).
          </p>
          <AdminKolejkaSoltysowKlient wnioski={wnioskiSoltys} />
        </section>
      ) : null}

      {!brakDostepu ? <AdminNowaWiesKlient /> : null}

      {!brakDostepu ? (
        <section className="mt-12">
          <h2 className="font-serif text-2xl text-green-950">Ostatnie uruchomienia cron</h2>
          <p className="mt-1 text-sm text-stone-600">
            Wiersze zapisuje API po wywołaniach z Vercel Cron (`/api/automatyzacje/run`, `/api/kanaly-rss/sync`).
          </p>
          {cronBladTabeli ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              Tabela <code className="font-mono">cron_runs</code> nie istnieje w bazie — zastosuj migrację{" "}
              <code className="font-mono">20260504150000_cron_runs_audyt.sql</code>.
            </p>
          ) : cronErr ? (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              Nie udało się odczytać cron: {cronErr.message}
            </p>
          ) : null}
          {!cronErr && (cronWpisy?.length ?? 0) === 0 ? (
            <p className="mt-4 text-sm text-stone-600">Brak zapisów (cron jeszcze nie uruchomiony po wdrożeniu migracji).</p>
          ) : null}
          {cronWpisy && cronWpisy.length > 0 ? (
            <>
              {(() => {
                const bledy = cronWpisy.filter((r) => r.status === "error").slice(0, 10);
                return bledy.length > 0 ? (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                    <h3 className="text-sm font-semibold text-red-950">Ostatnie błędy (max 10)</h3>
                    <ul className="mt-2 list-inside list-disc text-sm text-red-900">
                      {bledy.map((r) => (
                        <li key={r.id}>
                          <span className="font-mono text-xs">{r.endpoint}</span> —{" "}
                          {r.error_message ?? "brak komunikatu"} (
                          {new Date(r.started_at).toLocaleString("pl-PL")})
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null;
              })()}
              <div className="mt-6 max-w-full overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
                <table className="min-w-[36rem] text-left text-sm sm:min-w-full">
                  <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase text-stone-600">
                    <tr>
                      <th className="px-2 py-2 sm:px-3">Start</th>
                      <th className="px-2 py-2 sm:px-3">Endpoint</th>
                      <th className="px-2 py-2 sm:px-3">Status</th>
                      <th className="px-2 py-2 sm:px-3">IP</th>
                      <th className="px-2 py-2 sm:px-3">Błąd</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {cronWpisy.map((r) => (
                      <tr key={r.id}>
                        <td className="whitespace-nowrap px-2 py-2 text-stone-600 sm:px-3">
                          {new Date(r.started_at).toLocaleString("pl-PL")}
                        </td>
                        <td className="max-w-[12rem] break-all px-2 py-2 font-mono text-xs sm:max-w-none sm:px-3">
                          {r.endpoint}
                        </td>
                        <td className="whitespace-nowrap px-2 py-2 sm:px-3">{r.status}</td>
                        <td className="px-2 py-2 font-mono text-xs sm:px-3">{r.source_ip ?? "—"}</td>
                        <td className="max-w-[14rem] break-words px-2 py-2 text-xs sm:max-w-none sm:px-3">
                          {r.error_message ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </section>
      ) : null}

      <p className="mt-10 text-sm text-stone-500">
        <Link href="/panel" className="text-green-800 underline">
          ← Start panelu
        </Link>
      </p>
    </main>
  );
}
