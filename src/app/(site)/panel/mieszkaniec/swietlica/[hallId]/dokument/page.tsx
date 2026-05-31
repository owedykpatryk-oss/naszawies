import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DokumentWynajmuWidok } from "@/components/swietlica/dokument-wynajmu-widok";
import { PanelStronaMieszkaneca } from "@/components/panel/panel-strona-mieszkaneca";
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
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
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
    <PanelStronaMieszkaneca
      tytul={dane.rezerwacja ? "Dokument Twojej rezerwacji" : "Dokument informacyjny"}
      opis={
        <>
          Regulamin (tekst i plik), kaucja, ceny, wyposażenie i schematy sali
          {dane.rezerwacja ? " — dla wybranej rezerwacji." : "."}
          {dane.rezerwacja ? (
            <>
              {" "}
              <Link href={`/panel/mieszkaniec/swietlica/${hallId}/dokument`} className="font-medium text-green-800 underline">
                Dokument ogólny
              </Link>
            </>
          ) : null}
        </>
      }
      hrefPowrotu={`/panel/mieszkaniec/swietlica/${hallId}`}
      etykietaPowrotu="← Wróć do sali"
      szeroki
      dzieci={
        <>
          <NawigacjaSali hallId={hallId} rola="mieszkaniec" pokazRzutParteruMieszkaniec={dane.rzutParteru != null} />
          <DokumentWynajmuWidok dane={dane} />
        </>
      }
    />
  );
}
