import type { Metadata } from "next";
import Link from "next/link";
import { StronaWRozbudowie } from "@/components/strona-w-rozbudowie";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

type Props = { params: { sciezka?: string[] } };

export function generateMetadata({ params }: Props): Metadata {
  const sc = params.sciezka?.join(" / ") || "panel";
  return { title: `Panel — ${sc}` };
}

export default async function PanelCatchAllPage({ params }: Props) {
  const sciezka = params.sciezka?.filter(Boolean) ?? [];

  if (sciezka.length === 0) {
    const supabase = utworzKlientaSupabaseSerwer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return (
      <main className="mx-auto max-w-2xl px-5 py-16 text-stone-800">
        <p className="mb-4 text-sm text-stone-500">
          <Link href="/" className="text-green-800 underline">
            ← Strona główna
          </Link>
        </p>
        <h1 className="mb-4 font-serif text-3xl text-green-950">Panel</h1>
        {user ? (
          <>
            <p className="mb-2 leading-relaxed">
              Zalogowano jako: <strong>{user.email}</strong>
            </p>
            <p className="mb-6 text-sm text-stone-600">
              Ścieżki z dokumentacji:{" "}
              <code className="rounded bg-stone-100 px-1 text-sm">
                /panel/soltys, /panel/mieszkaniec, /panel/admin
              </code>{" "}
              — moduły w budowie (Faza 1).
            </p>
            <form action="/wyloguj" method="post">
              <button
                type="submit"
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 hover:bg-stone-50"
              >
                Wyloguj się
              </button>
            </form>
          </>
        ) : (
          <p className="text-stone-600">
            <Link href="/logowanie" className="text-green-800 underline">
              Zaloguj się
            </Link>
          </p>
        )}
      </main>
    );
  }

  const opis = `Ścieżka panelu: /${sciezka.join("/")}. Funkcje (ogłoszenia, świetlica, mieszkańcy) — Faza 1 i dalsze wg ROADMAP.md.`;

  return (
    <StronaWRozbudowie
      tytul={`Panel: ${sciezka.join(" → ")}`}
      opis={opis}
      kodDokumentacji="Cloude Docs/naszawies-package/frontend/FRONTEND.md"
    />
  );
}
