import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DokumentWynajmuWidok } from "@/components/swietlica/dokument-wynajmu-widok";
import { PanelStronaSoltysa } from "@/components/panel/panel-strona-soltysa";
import { NawigacjaSali } from "@/components/swietlica/nawigacja-sali";
import {
  pobierzDaneDokumentuWynajmu,
  pobierzDaneDokumentuWynajmuRezerwacji,
} from "@/lib/swietlica/pobierz-dane-dokumentu-wynajmu";
import { czyUzytkownikJestSoltysemDlaSali } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";

type Props = {
  params: { hallId: string };
  searchParams?: { rezerwacja?: string | string[] };
};

export const metadata: Metadata = {
  title: "Dokument wynajmu świetlicy",
};

export default async function DokumentWynajmuSoltysPage({ params, searchParams }: Props) {
  const hallId = params.hallId;
  const uuidOk = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(hallId);
  if (!uuidOk) notFound();

  const rezerwacjaParam = searchParams?.rezerwacja;
  const bookingId = Array.isArray(rezerwacjaParam) ? rezerwacjaParam[0] : rezerwacjaParam;

  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaPanelu();

  const wolno = await czyUzytkownikJestSoltysemDlaSali(supabase, user.id, hallId);
  if (!wolno) {
    notFound();
  }

  const dane =
    bookingId && /^[0-9a-f-]{36}$/i.test(bookingId)
      ? await pobierzDaneDokumentuWynajmuRezerwacji(hallId, bookingId)
      : await pobierzDaneDokumentuWynajmu(hallId);
  if (!dane) notFound();

  return (
    <PanelStronaSoltysa
      tytul={dane.rezerwacja ? "Dokument rezerwacji" : "Dokument wynajmu"}
      opis={
        <>
          {dane.rezerwacja
            ? "Zestawienie dla konkretnej rezerwacji: termin, zamówiony asortyment, regulamin i protokół odbioru (jeśli zapisany)."
            : "Podgląd z aktualnych danych sali, regulaminu, kaucji, cen, asortymentu, rzutu parteru i planu stołów."}
          {dane.rezerwacja ? (
            <>
              {" "}
              <Link href={`/panel/soltys/swietlica/${hallId}/dokument`} className="font-medium text-green-800 underline">
                Dokument ogólny sali
              </Link>
            </>
          ) : null}
        </>
      }
      powrotHref={`/panel/soltys/swietlica/${hallId}`}
      powrotEtykieta="← Wróć do edycji sali"
      szeroki
      dzieci={
        <>
          <NawigacjaSali hallId={hallId} rola="soltys" />
          <DokumentWynajmuWidok dane={dane} />
        </>
      }
    />
  );
}
