import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fotokronika (sołtys)",
};

/** Szkielet — albumy / zdjęcia: ROADMAP faza 2; tabele m.in. `photo_albums`, `photos`. */
export default function SoltysFotokronikaPage() {
  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/soltys" className="text-green-800 underline">
          ← Panel sołtysa
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Fotokronika wsi</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
        Planowane: moderacja zgłoszeń zdjęć od mieszkańców, albumy wydarzeń. Mieszkańcy będą dodawać treści w{" "}
        <Link href="/panel/mieszkaniec/fotokronika" className="text-green-800 underline">
          swoim panelu
        </Link>
        .
      </p>
    </main>
  );
}
