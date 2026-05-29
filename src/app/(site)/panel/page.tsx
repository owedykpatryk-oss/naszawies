import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pobierzStanPrzewodnikaStartu } from "@/lib/panel/stan-przewodnika-startu";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { PanelPrzewodnikStartu } from "./panel-przewodnik-startu";

export const metadata: Metadata = {
  title: "Panel",
  description: "Panel użytkownika naszawies.pl.",
};

export default async function PanelPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/logowanie?next=/panel");
  }

  const { data: profil } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  const signupVillageIdRaw =
    user.user_metadata && typeof user.user_metadata === "object" ? user.user_metadata.signup_village_id : null;
  const maWyborWsiZRejestracji =
    typeof signupVillageIdRaw === "string" && signupVillageIdRaw.trim().length > 0;

  const stanStartu = await pobierzStanPrzewodnikaStartu(supabase, user.id, maWyborWsiZRejestracji);

  return (
    <main>
      <PanelPrzewodnikStartu stan={stanStartu} />
      <header className="wow-wejscie relative mb-10 overflow-hidden rounded-2xl border border-stone-200/80 bg-gradient-to-br from-white via-white to-emerald-50/40 p-6 shadow-sm ring-1 ring-stone-900/[0.04] sm:p-7">
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl"
          aria-hidden
        />
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800/80">Konto</p>
        <h1 className="mt-1 font-serif text-3xl tracking-tight text-green-950 sm:text-[2rem]">Witaj w panelu</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Zalogowano: <span className="font-medium text-stone-800">{user.email}</span>
          {profil?.display_name ? (
            <>
              {" "}
              <span className="text-stone-400">·</span>{" "}
              <span className="text-stone-800">{profil.display_name}</span>
            </>
          ) : null}
        </p>
      </header>

      <p className="mb-6 text-sm text-stone-600">
        <Link href="/panel/pierwsze-kroki" className="font-medium text-green-800 underline">
          Pierwsze kroki po rejestracji
        </Link>{" "}
        — pełniejszy opis: profil, wybór wsi, różnice mieszkaniec / sołtys.
        {!stanStartu.jestSoltysem ? (
          <>
            {" "}
            <Link href="/panel/wniosek-soltysa" className="font-medium text-green-800 underline">
              Wniosek o rolę sołtysa
            </Link>
            .
          </>
        ) : null}
      </p>

      <h2 className="sr-only">Skróty do modułów</h2>
      <ul className="mb-10 grid gap-4 text-sm sm:grid-cols-2">
        <li className="group panel-karta ring-2 ring-emerald-600/15">
          <Link href="/panel/moje" className="link-panel">
            Moje
            <span
              className="ml-0.5 inline-block text-emerald-700/80 transition group-hover:translate-x-0.5"
              aria-hidden
            >
              →
            </span>
          </Link>
          <p className="mt-2 text-sm text-stone-600">Twoje wsie, gminy, powiaty i ulubione — bez szukania po serwisie.</p>
        </li>
        <li className="group panel-karta">
          <Link href="/panel/profil" className="link-panel">
            Konto
            <span
              className="ml-0.5 inline-block text-emerald-700/80 transition group-hover:translate-x-0.5"
              aria-hidden
            >
              →
            </span>
          </Link>
          <p className="mt-2 text-sm text-stone-600">Zdjęcie, nazwa, telefon, bio.</p>
        </li>
        <li className="group panel-karta">
          <Link href="/panel/mieszkaniec" className="link-panel">
            Działania (mieszkaniec)
            <span
              className="ml-0.5 inline-block text-emerald-700/80 transition group-hover:translate-x-0.5"
              aria-hidden
            >
              →
            </span>
          </Link>
          <p className="mt-2 text-sm text-stone-600">Wnioski o role (mieszkaniec, OSP, KGW), ogłoszenia, świetlica — w tym <Link href="/panel/mieszkaniec/marketplace" className="text-green-800 underline">rynek lokalny</Link>.</p>
        </li>
        <li className="group panel-karta">
          <Link href="/panel/soltys" className="link-panel">
            Sołtys
            <span
              className="ml-0.5 inline-block text-emerald-700/80 transition group-hover:translate-x-0.5"
              aria-hidden
            >
              →
            </span>
          </Link>
          <p className="mt-2 text-sm text-stone-600">Wnioski o role, moderacja, wyposażenie sal.</p>
        </li>
        <li className="group panel-karta ring-2 ring-orange-300/25">
          <Link href="/panel/mieszkaniec/marketplace" className="link-panel">
            Rynek lokalny
            <span
              className="ml-0.5 inline-block text-orange-700/80 transition group-hover:translate-x-0.5"
              aria-hidden
            >
              →
            </span>
          </Link>
          <p className="mt-2 text-sm text-stone-600">Dodaj ogłoszenie — produkty, maszyny, działki z mapą Geoportalu.</p>
        </li>
        <li className="group panel-karta">
          <Link href="/panel/powiadomienia" className="link-panel">
            Powiadomienia
            <span
              className="ml-0.5 inline-block text-emerald-700/80 transition group-hover:translate-x-0.5"
              aria-hidden
            >
              →
            </span>
          </Link>
          <p className="mt-2 text-sm text-stone-600">Akceptacje ról i inne komunikaty.</p>
        </li>
      </ul>
      <form action="/wyloguj" method="post">
        <button
          type="submit"
          className="rounded-xl border-2 border-stone-300/90 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 shadow-sm transition hover:border-stone-400 hover:bg-stone-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500"
        >
          Wyloguj się
        </button>
      </form>
    </main>
  );
}
