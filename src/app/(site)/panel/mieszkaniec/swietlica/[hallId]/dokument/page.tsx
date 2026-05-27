import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DokumentWynajmuWidok } from "@/components/swietlica/dokument-wynajmu-widok";
import { NawigacjaSali } from "@/components/swietlica/nawigacja-sali";
import {
  pobierzDaneDokumentuWynajmu,
  pobierzDaneDokumentuWynajmuRezerwacji,
} from "@/lib/swietlica/pobierz-dane-dokumentu-wynajmu";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

type Props = {
  params: { hallId: string };
  searchParams?: { rezerwacja?: string | string[] };
};

export const metadata: Metadata = {
  title: "Dokument informacyjny — świetlica",
};

export default async function DokumentWynajmuMieszkaniecPage({ params, searchParams }: Props) {
  const hallId = params.hallId;
  const uuidOk = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(hallId);
  if (!uuidOk) notFound();

  const rezerwacjaParam = searchParams?.rezerwacja;
  const bookingId = Array.isArray(rezerwacjaParam) ? rezerwacjaParam[0] : rezerwacjaParam;

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/logowanie?next=/panel/mieszkaniec/swietlica/${hallId}/dokument`);

  if (bookingId && /^[0-9a-f-]{36}$/i.test(bookingId)) {
    const { data: rezerwacja } = await supabase
      .from("hall_bookings")
      .select("id, booked_by")
      .eq("id", bookingId)
      .eq("hall_id", hallId)
      .maybeSingle();
    if (!rezerwacja || rezerwacja.booked_by !== user.id) {
      notFound();
    }
  }

  const dane =
    bookingId && /^[0-9a-f-]{36}$/i.test(bookingId)
      ? await pobierzDaneDokumentuWynajmuRezerwacji(hallId, bookingId)
      : await pobierzDaneDokumentuWynajmu(hallId);
  if (!dane) notFound();

  return (
    <main className="pb-16">
      <p className="mb-2 text-sm text-stone-500">
        <Link href={`/panel/mieszkaniec/swietlica/${hallId}`} className="text-green-800 underline">
          ← Wróć do sali
        </Link>
        {dane.rezerwacja ? (
          <>
            {" · "}
            <Link href={`/panel/mieszkaniec/swietlica/${hallId}/dokument`} className="text-green-800 underline">
              Dokument ogólny
            </Link>
          </>
        ) : null}
      </p>
      <NawigacjaSali hallId={hallId} rola="mieszkaniec" pokazRzutParteruMieszkaniec={dane.rzutParteru != null} />
      <h1 className="tytul-sekcji-panelu">
        {dane.rezerwacja ? "Dokument Twojej rezerwacji" : "Dokument informacyjny"}
      </h1>
      <p className="mt-1 text-sm text-stone-600">
        Regulamin (tekst i plik), kaucja, ceny, wyposażenie i schematy sali
        {dane.rezerwacja ? " — dla wybranej rezerwacji." : "."}
      </p>
      <div className="mt-8">
        <DokumentWynajmuWidok dane={dane} />
      </div>
    </main>
  );
}
