import type { Metadata } from "next";
import Link from "next/link";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

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
    return (
      <main>
        <h1 className="mb-4 font-serif text-3xl text-green-950">Panel</h1>
        <p className="text-stone-600">
          <Link href="/logowanie" className="text-green-800 underline">
            Zaloguj się
          </Link>
        </p>
      </main>
    );
  }

  const { data: profil } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main>
      <h1 className="mb-4 font-serif text-3xl text-green-950">Panel</h1>
      <p className="mb-2 leading-relaxed">
        Zalogowano jako: <strong>{user.email}</strong>
        {profil?.display_name ? (
          <>
            {" "}
            · <span className="text-stone-700">{profil.display_name}</span>
          </>
        ) : null}
      </p>
      <ul className="mb-8 grid gap-3 text-sm sm:grid-cols-2">
        <li className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <Link href="/panel/profil" className="font-medium text-green-900 underline">
            Mój profil
          </Link>
          <p className="mt-1 text-stone-600">Zdjęcie, nazwa, telefon, bio.</p>
        </li>
        <li className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <Link href="/panel/mieszkaniec" className="font-medium text-green-900 underline">
            Mieszkaniec
          </Link>
          <p className="mt-1 text-stone-600">Wniosek o rolę, ogłoszenia, świetlica.</p>
        </li>
        <li className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <Link href="/panel/soltys" className="font-medium text-green-900 underline">
            Sołtys
          </Link>
          <p className="mt-1 text-stone-600">Wnioski mieszkańców, moderacja, wyposażenie sal.</p>
        </li>
        <li className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
          <Link href="/panel/powiadomienia" className="font-medium text-green-900 underline">
            Powiadomienia
          </Link>
          <p className="mt-1 text-stone-600">Akceptacje ról i inne komunikaty.</p>
        </li>
      </ul>
      <form action="/wyloguj" method="post">
        <button
          type="submit"
          className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
        >
          Wyloguj się
        </button>
      </form>
    </main>
  );
}
