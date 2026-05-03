import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DokumentWynajmuWidok } from "@/components/swietlica/dokument-wynajmu-widok";
import { NawigacjaSali } from "@/components/swietlica/nawigacja-sali";
import { pobierzDaneDokumentuWynajmu } from "@/lib/swietlica/pobierz-dane-dokumentu-wynajmu";
import { czyUzytkownikJestSoltysemDlaSali } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

type Props = { params: { hallId: string } };

export const metadata: Metadata = {
  title: "Dokument wynajmu świetlicy",
};

export default async function DokumentWynajmuSoltysPage({ params }: Props) {
  const hallId = params.hallId;
  const uuidOk = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(hallId);
  if (!uuidOk) notFound();

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/logowanie?next=/panel/soltys/swietlica/${hallId}/dokument`);

  const wolno = await czyUzytkownikJestSoltysemDlaSali(supabase, user.id, hallId);
  if (!wolno) {
    notFound();
  }

  const dane = await pobierzDaneDokumentuWynajmu(hallId);
  if (!dane) notFound();

  return (
    <main className="pb-16">
      <p className="mb-2 text-sm text-stone-500">
        <Link href={`/panel/soltys/swietlica/${hallId}`} className="text-green-800 underline">
          ← Wróć do edycji sali
        </Link>
      </p>
      <NawigacjaSali hallId={hallId} rola="soltys" />
      <h1 className="tytul-sekcji-panelu">Dokument wynajmu</h1>
      <p className="mt-1 text-sm text-stone-600">
        Podgląd z aktualnych danych sali, regulaminu, kaucji, cen i asortymentu. Użyj druku, by zapisać PDF lub
        wydrukować dla najemcy.
      </p>
      <div className="mt-8">
        <DokumentWynajmuWidok dane={dane} />
      </div>
    </main>
  );
}
