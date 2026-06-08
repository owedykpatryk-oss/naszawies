import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { StronaAuthUklad } from "@/components/auth/strona-auth-uklad";
import { bezpiecznaSciezkaNastepna } from "@/lib/auth/bezpieczna-sciezka-nastepna";
import { pobierzUzytkownikaSerwer } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { pobierzPochodzeniePubliczne } from "@/lib/zadanie/pochodzenie-publiczne";
import { RejestracjaKlient } from "./rejestracja-klient";
import { pobierzWiesPoIdDlaRejestracji } from "./akcje-katalog-wsi";

export const metadata: Metadata = {
  title: "Rejestracja",
  description: "Załóż konto na naszawies.pl — dołącz do swojej wsi za darmo.",
};

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function RejestracjaPage({ searchParams }: Props) {
  const pochodzenie = pobierzPochodzeniePubliczne();
  const nastepnyParam = searchParams.next;
  const nastepna =
    typeof nastepnyParam === "string" ? bezpiecznaSciezkaNastepna(nastepnyParam) : "/panel";

  const wiesParam = searchParams.wies;
  const wiesId = typeof wiesParam === "string" ? wiesParam.trim() : "";
  const intencjaParam = searchParams.intencja;
  const intencjaRaw = typeof intencjaParam === "string" ? intencjaParam.trim() : "";
  const domyslnaIntencja =
    intencjaRaw === "mieszkaniec" || intencjaRaw === "soltys" ? intencjaRaw : undefined;

  const wiesPrefill = wiesId ? await pobierzWiesPoIdDlaRejestracji(wiesId) : null;

  try {
    const user = await pobierzUzytkownikaSerwer();
    if (user) {
      redirect(nastepna);
    }
  } catch {
    // brak env — strona dalej pokaże formularz
  }

  return (
    <StronaAuthUklad
      tytul="Rejestracja"
      naglowekHero="Dołącz do swojej wsi"
      leadHero="Załóż konto w kilka minut — potem wybierzesz miejscowość i rolę. Sołtys i mieszkaniec to ten sam start."
      eyebrow="Rejestracja · 2 min"
      korzysci={[
        { ikona: "✉️", tekst: "Potwierdzenie e-maila i od razu dostęp do panelu." },
        { ikona: "🤝", tekst: "Wniosek do wsi — sołtys akceptuje, Ty masz porządek w sprawach." },
        { ikona: "🛒", tekst: "Rynek lokalny bez prowizji i katalog sąsiadów z okolicy." },
      ]}
      opis={
        wiesPrefill ? (
          <p className="rounded-xl border border-emerald-200/80 bg-emerald-50 px-3 py-2.5 text-left text-emerald-950">
            Dołączasz do wsi <strong>{wiesPrefill.nazwa}</strong> — po potwierdzeniu e-maila wniosek trafi do sołtysa
            automatycznie.
          </p>
        ) : (
          <p>
            <strong>To samo konto</strong> dla każdego: mieszkaniec, sołtys i inne role wybierzesz po założeniu konta.
            Tutaj tylko zakładasz logowanie.
          </p>
        )
      }
      stopka={
        <>
          <Link href="/logowanie">Masz już konto? Zaloguj się</Link>
          {" · "}
          <Link href="/szukaj">Szukaj wsi</Link>
        </>
      }
    >
      <RejestracjaKlient
        pochodzeniePubliczne={pochodzenie}
        nastepnaSciezka={nastepna}
        domyslnaIntencja={domyslnaIntencja ?? (wiesPrefill ? "mieszkaniec" : undefined)}
        domyslnaWies={wiesPrefill}
      />
    </StronaAuthUklad>
  );
}
