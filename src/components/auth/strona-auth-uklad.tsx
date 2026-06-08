import type { ReactNode } from "react";
import Link from "next/link";
import { LogoNaszawies } from "@/components/marka/logo-naszawies";
import "@/styles/auth-strona.css";

type Korzysc = {
  ikona: string;
  tekst: string;
};

type Props = {
  tytul: string;
  opis: ReactNode;
  children: ReactNode;
  stopka?: ReactNode;
  naglowekHero?: string;
  leadHero?: string;
  eyebrow?: string;
  korzysci?: Korzysc[];
  powrot?: { href: string; label: string };
};

const DOMYSLNE_KORZYSCI: Korzysc[] = [
  { ikona: "🏡", tekst: "Panel mieszkańca lub sołtysa — wszystko w jednym miejscu." },
  { ikona: "🔔", tekst: "Powiadomienia o zmianach, terminach i decyzjach w gminie." },
  { ikona: "🗺️", tekst: "Mapa wsi, rynek lokalny i katalog — po zalogowaniu od razu." },
];

export function StronaAuthUklad({
  tytul,
  opis,
  children,
  stopka,
  naglowekHero = "Cyfrowy dom dla naszej wsi",
  leadHero = "Jedno konto dla Ciebie — wybierzesz miejscowość i rolę po pierwszym wejściu. Bez opłat, bez prowizji.",
  eyebrow = "Bezpłatnie · 0 zł",
  korzysci = DOMYSLNE_KORZYSCI,
  powrot,
}: Props) {
  return (
    <main className="auth-strona">
      <section className="auth-strona__hero" aria-hidden={false}>
        <div className="auth-strona__hero-tlo" role="presentation" />
        <div className="auth-strona__hero-tresc">
          <p className="auth-strona__eyebrow">{eyebrow}</p>
          <h2 className="auth-strona__naglowek-hero">{naglowekHero}</h2>
          <p className="auth-strona__lead-hero">{leadHero}</p>
          <ul className="auth-strona__korzysci">
            {korzysci.map((k) => (
              <li key={k.tekst} className="auth-strona__korzysc">
                <span className="auth-strona__korzysc-ikona" aria-hidden>
                  {k.ikona}
                </span>
                <span>{k.tekst}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="auth-strona__panel">
        <div className="auth-strona__karta">
          <div className="auth-strona__logo">
            <LogoNaszawies kompakt href="/" />
          </div>

          {powrot ? (
            <Link href={powrot.href} className="auth-strona__powrot">
              <span aria-hidden>←</span>
              {powrot.label}
            </Link>
          ) : null}

          <h1 className="auth-strona__tytul">{tytul}</h1>
          <div className="auth-strona__opis">{opis}</div>
          <div className="auth-strona__tresc">{children}</div>
          {stopka ? <div className="auth-strona__stopka">{stopka}</div> : null}
        </div>
      </section>
    </main>
  );
}
