import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DokumentWynajmuWidok } from "@/components/swietlica/dokument-wynajmu-widok";
import { NawigacjaSali } from "@/components/swietlica/nawigacja-sali";
import { pobierzDaneDokumentuWynajmu } from "@/lib/swietlica/pobierz-dane-dokumentu-wynajmu";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

type Props = { params: { hallId: string } };

export const metadata: Metadata = {
  title: "Dokument informacyjny — świetlica",
};

export default async function DokumentWynajmuMieszkaniecPage({ params }: Props) {
  const hallId = params.hallId;
  const uuidOk = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(hallId);
  if (!uuidOk) notFound();

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/logowanie?next=/panel/mieszkaniec/swietlica/${hallId}/dokument`);

  const dane = await pobierzDaneDokumentuWynajmu(hallId);
  if (!dane) notFound();

  return (
    <main className="pb-16">
      <p className="mb-2 text-sm text-stone-500">
        <Link href={`/panel/mieszkaniec/swietlica/${hallId}`} className="text-green-800 underline">
          ← Wróć do sali
        </Link>
      </p>
      <NawigacjaSali hallId={hallId} rola="mieszkaniec" />
      <h1 className="font-serif text-2xl text-green-950">Dokument informacyjny</h1>
      <p className="mt-1 text-sm text-stone-600">
        Ten sam zestaw informacji co dla sołtysa: regulamin, kaucja, ceny, wyposażenie i plan stołów (jeśli został
        zapisany).
      </p>
      <div className="mt-8">
        <DokumentWynajmuWidok dane={dane} />
      </div>
    </main>
  );
}
