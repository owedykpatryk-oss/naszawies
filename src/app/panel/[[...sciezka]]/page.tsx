import type { Metadata } from "next";
import Link from "next/link";
import { StronaWRozbudowie } from "@/components/strona-w-rozbudowie";

type Props = { params: { sciezka?: string[] } };

export function generateMetadata({ params }: Props): Metadata {
  const sc = params.sciezka?.join(" / ") || "panel";
  return { title: `Panel — ${sc}` };
}

export default function PanelCatchAllPage({ params }: Props) {
  const sciezka = params.sciezka?.filter(Boolean) ?? [];
  if (sciezka.length === 0) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-16 text-stone-800">
        <p className="mb-4 text-sm text-stone-500">
          <Link href="/" className="text-green-800 underline">
            ← Strona główna
          </Link>
        </p>
        <h1 className="mb-4 font-serif text-3xl text-green-950">Panel</h1>
        <p className="mb-6 leading-relaxed">
          Po wdrożeniu logowania nastąpi przekierowanie do pulpitu sołtysa,
          mieszkańca lub administratora. Ścieżki zgodne z dokumentacją:{" "}
          <code className="rounded bg-stone-100 px-1 text-sm">
            /panel/soltys, /panel/mieszkaniec, /panel/admin
          </code>
          .
        </p>
        <p className="text-sm text-stone-600">
          Zobacz:{" "}
          <code className="rounded bg-stone-100 px-1">
            Cloude Docs/naszawies-package/frontend/FRONTEND.md
          </code>
        </p>
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
