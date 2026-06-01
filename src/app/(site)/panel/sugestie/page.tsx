import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FeedbackAnkietaKlient } from "@/components/feedback/feedback-ankieta-klient";
import { pobierzStanPromptuAnkiety } from "@/lib/feedback/stan-promptu-ankiety";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

export const metadata: Metadata = {
  title: "Sugestie i opinia",
  description: "Podziel się opinią o naszawies.pl — co działa, co ulepszyć.",
  robots: { index: false, follow: false },
};

export default async function PanelSugestiePage() {
  const user = await pobierzUzytkownikaSerwer();
  if (!user) redirect("/logowanie?next=/panel/sugestie");

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user: pelny },
  } = await supabase.auth.getUser();

  const stan = await pobierzStanPromptuAnkiety(supabase, user.id, pelny?.created_at);

  const { data: ostatnie } = await supabase
    .from("platform_user_feedback")
    .select("id, created_at, rating_overall, what_improve, admin_status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <main className="max-w-2xl">
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel" className="text-green-800 underline">
          ← Panel
        </Link>
      </p>
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-800">Twój głos</p>
        <h1 className="font-serif text-2xl text-green-950 sm:text-3xl">Sugestie i opinia</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Pomagasz nam budować lepszy serwis dla wsi. Opinie czytamy regularnie — dziękujemy za konkret (ekran, funkcja,
          co było mylące).
        </p>
        {stan.dniOdRejestracji != null ? (
          <p className="mt-2 text-xs text-stone-500">
            Konto od {stan.dniOdRejestracji} dni
            {stan.juzWyslanoAnkiete14d ? " · wysłałeś już ankietę powitalną" : ""}.
          </p>
        ) : null}
      </header>

      <FeedbackAnkietaKlient surveyKind="voluntary" tryb="strona" dniOdRejestracji={stan.dniOdRejestracji} />

      {(ostatnie?.length ?? 0) > 0 ? (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Twoje ostatnie zgłoszenia</h2>
          <ul className="mt-3 space-y-2">
            {ostatnie!.map((o) => (
              <li key={o.id} className="rounded-xl border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm">
                <p className="text-xs text-stone-500">
                  {new Date(o.created_at).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" })}
                  {o.rating_overall ? ` · ocena ${o.rating_overall}/5` : ""}
                  {o.admin_status && o.admin_status !== "new" ? ` · ${o.admin_status}` : ""}
                </p>
                {o.what_improve ? (
                  <p className="mt-1 line-clamp-2 text-stone-800">{o.what_improve}</p>
                ) : (
                  <p className="mt-1 text-stone-600">—</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-8 text-sm text-stone-600">
        Sprawa pilna lub RODO?{" "}
        <Link href="/kontakt" className="font-medium text-green-800 underline">
          Formularz kontaktowy
        </Link>
        .
      </p>
    </main>
  );
}
