import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StronaAuthUklad } from "@/components/auth/strona-auth-uklad";
import { bezpiecznaSciezkaNastepna } from "@/lib/auth/bezpieczna-sciezka-nastepna";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { ponowJesliRedirect } from "@/lib/next/ponow-redirect";
import { pobierzPochodzeniePubliczne } from "@/lib/zadanie/pochodzenie-publiczne";
import { LogowanieKlient } from "./logowanie-klient";

export const metadata: Metadata = {
  title: "Logowanie",
  description: "Logowanie do naszawies.pl.",
};

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function LogowaniePage({ searchParams }: Props) {
  const pochodzenie = pobierzPochodzeniePubliczne();
  const nastepnyParam = searchParams.next;
  const nastepna =
    typeof nastepnyParam === "string" ? bezpiecznaSciezkaNastepna(nastepnyParam) : "/mapa";
  const bladParam = searchParams.blad;
  const kodBledu = typeof bladParam === "string" ? bladParam : undefined;
  const szczegolParam = searchParams.szczegol;
  const szczegolBledu = typeof szczegolParam === "string" ? szczegolParam.slice(0, 400) : undefined;
  const emailParam = searchParams.email;
  const emailStartowy = typeof emailParam === "string" ? emailParam.slice(0, 200) : "";

  try {
    const user = await pobierzUzytkownikaSerwer();
    if (user) {
      redirect(nastepna);
    }
  } catch (error) {
    ponowJesliRedirect(error);
  }

  return (
    <StronaAuthUklad
      tytul="Logowanie"
      opis={
        <p>
          Zaloguj się przez Google, Facebook albo e-mail. Po pierwszym wejściu wybierzesz miejscowość i rolę — konto
          jest przypisane do Ciebie, nie do jednej wsi.
        </p>
      }
      stopka={
        <>
          <Link href="/rejestracja">Załóż konto</Link>
          {" · "}
          <Link href="/">Strona główna</Link>
        </>
      }
    >
      <LogowanieKlient
        pochodzeniePubliczne={pochodzenie}
        nastepnaSciezka={nastepna}
        kodBledu={kodBledu}
        szczegolBledu={szczegolBledu}
        emailStartowy={emailStartowy}
      />
    </StronaAuthUklad>
  );
}
