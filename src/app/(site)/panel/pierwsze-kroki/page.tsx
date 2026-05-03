import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pierwsze kroki w panelu",
  description: "Przewodnik po starcie w naszawies.pl — profil, wieś, mieszkaniec, sołtys.",
};

const linkToc = [
  { href: "#krok-profil", label: "1. Profil" },
  { href: "#krok-wies", label: "2. Wieś i gmina" },
  { href: "#krok-soltys", label: "3. Sołtys" },
  { href: "#krok-powiadomienia", label: "4. Powiadomienia" },
  { href: "#faq", label: "FAQ" },
] as const;

export default function PanelPierwszeKrokiPage() {
  return (
    <main className="max-w-3xl">
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel" className="text-green-800 underline">
          ← Start panelu
        </Link>
      </p>
      <h1 className="tytul-sekcji-panelu">Pierwsze kroki po rejestracji</h1>
      <p className="mt-3 text-sm text-stone-600">
        Poniżej kolejność działań dla typowego użytkownika. Na stronie głównej panelu (
        <Link href="/panel" className="text-green-800 underline">
          Start
        </Link>
        ) ten sam schemat jest skrócony do listy z linkami i paskiem postępu.
      </p>

      <nav
        aria-label="Spis treści przewodnika"
        className="mt-6 rounded-xl border border-stone-200 bg-stone-50/80 p-4 sm:sticky sm:top-20"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Na tej stronie</p>
        <ul className="mt-2 flex flex-wrap gap-2 text-sm">
          {linkToc.map(({ href, label }) => (
            <li key={href}>
              <a
                href={href}
                className="inline-block rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-green-900 shadow-sm hover:border-green-800/30 hover:bg-emerald-50/50"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <section id="krok-profil" className="scroll-mt-24 mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-lg text-green-950">1. Profil konta</h2>
        <p className="mt-2 text-sm text-stone-700">
          Wejdź w <Link href="/panel/profil" className="font-medium text-green-800 underline">Mój profil</Link> i ustaw
          przynajmniej <strong>nazwę wyświetlaną</strong> (np. imię i pierwsza litera nazwiska lub pseudonim znanego
          we wsi). Możesz dodać zdjęcie, krótkie bio oraz telefon — jeśli zezwolisz na widoczność publiczną, zobaczą go
          sąsiedzi na profilu użytkownika.
        </p>
      </section>

      <section id="krok-wies" className="scroll-mt-24 mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-lg text-green-950">2. Wybór miejscowości i gminy</h2>
        <p className="mt-2 text-sm text-stone-700">
          Portal jest powiązany z konkretnymi miejscowościami z urzędowego wykazu (TERYT). Otwórz{" "}
          <Link href="/wybierz-wies" className="font-medium text-green-800 underline">
            wyszukiwarkę / katalog
          </Link>
          , znajdź swoją wieś lub tę, która Cię interesuje. Jeśli wybór był już zrobiony podczas rejestracji, ten etap
          masz w praktyce za sobą. Dodatkowo możesz:
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-stone-700">
          <li>
            <strong>Mieszkaniec / OSP / KGW / rada</strong> — złóż wniosek o rolę w panelu{" "}
            <Link href="/panel/mieszkaniec#dolacz-mieszkaniec" className="text-green-800 underline">
              Mieszkaniec
            </Link>
            . Sołtys rozpatrzy wniosek; dostaniesz powiadomienie.
          </li>
          <li>
            <strong>Tylko obserwacja</strong> — bez pełnej roli możesz dodać wieś do obserwowanych (
            <Link href="/panel/mieszkaniec#obserwuj-wies" className="text-green-800 underline">
              Obserwuj wieś
            </Link>
            ) i wybrać, o czym chcesz dostawać powiadomienia (posty, zgłoszenia, wydarzenia).
          </li>
        </ul>
      </section>

      <section id="krok-soltys" className="scroll-mt-24 mt-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-5 shadow-sm">
        <h2 className="font-serif text-lg text-green-950">3. Jeśli jesteś sołtysem lub współadminem</h2>
        <p className="mt-2 text-sm text-stone-700">
          Przejście do <Link href="/panel/soltys" className="font-medium text-green-800 underline">panelu Sołtys</Link>{" "}
          pojawia się automatycznie, gdy masz aktywną rolę. Warto od razu:
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-stone-700">
          <li>
            <Link href="/panel/soltys/moja-wies" className="font-medium text-green-800 underline">
              Profil wsi
            </Link>
            — opis (kilka zdań na start), strona WWW, zdjęcie okładki: to widać na publicznej stronie wsi. Baner na
            stronie Start przypomni, dopóki opis nie będzie wystarczająco długi.
          </li>
          <li>
            <Link href="/panel/soltys/swietlica" className="font-medium text-green-800 underline">
              Świetlica
            </Link>
            — jeśli w wsi jest sala do rezerwacji: nazwa, adres (jeśli dotyczy), pojemność, plan sali i wyposażenie.
            Gdy wsi nie ma wydzielonej sali, możesz na razie pominąć ten moduł lub ustalić z administratorem platformy
            wariant „bez świetlicy w systemie”.
          </li>
          <li>
            <Link href="/panel/soltys#wnioski-o-role" className="font-medium text-green-800 underline">
              Wnioski o role
            </Link>
            — akceptuj lub odrzucaj osoby składające wniosek o mieszkańca lub role organizacyjne.
          </li>
          <li>
            Moderacja postów i wiadomości lokalnych — zobacz przegląd na{" "}
            <Link href="/panel/soltys" className="text-green-800 underline">
              stronie sołtysa
            </Link>
            .
          </li>
        </ol>
      </section>

      <section
        id="krok-powiadomienia"
        className="scroll-mt-24 mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
      >
        <h2 className="font-serif text-lg text-green-950">4. Powiadomienia i telefon</h2>
        <p className="mt-2 text-sm text-stone-700">
          W <Link href="/panel/powiadomienia" className="text-green-800 underline">Powiadomieniach</Link> zobaczysz
          decyzje sołtysa i skróty zdarzeń. Na stronie powiadomień możesz też włączyć{" "}
          <strong>Web Push</strong> (komunikat w przeglądarce) — wtedy ważne informacje mogą dotrzeć na telefon.
        </p>
      </section>

      <section id="faq" className="scroll-mt-24 mt-8 space-y-3 rounded-2xl border border-violet-200/70 bg-violet-50/40 p-5">
        <h2 className="font-serif text-lg text-green-950">Częste pytania</h2>
        <details className="rounded-lg border border-stone-200 bg-white p-3 text-sm shadow-sm open:shadow-md">
          <summary className="cursor-pointer font-medium text-stone-900">Dlaczego znika baner na stronie Start?</summary>
          <p className="mt-2 text-stone-700">
            Możesz go schować na 7 dni albo tylko do zamknięcia karty przeglądarki. Gdy nadal czegoś brakuje (np.
            krótki nick), baner wróci po czasie lub w nowej sesji — dopóki kroki nie będą spełnione.
          </p>
        </details>
        <details className="rounded-lg border border-stone-200 bg-white p-3 text-sm shadow-sm open:shadow-md">
          <summary className="cursor-pointer font-medium text-stone-900">Nie widzę mojej wsi w wyszukiwarce</summary>
          <p className="mt-2 text-stone-700">
            Katalog opiera się na urzędowym TERYT. Jeśli miejscowości brakuje, skontaktuj się z zespołem serwisu —
            administrator może dodać wieś i przypisać sołtysa (
            <Link href="/panel/admin" className="text-green-800 underline">
              panel admina
            </Link>
            , jeśli masz dostęp).
          </p>
        </details>
        <details className="rounded-lg border border-stone-200 bg-white p-3 text-sm shadow-sm open:shadow-md">
          <summary className="cursor-pointer font-medium text-stone-900">Czy muszę od razu podawać telefon?</summary>
          <p className="mt-2 text-stone-700">
            Nie — wystarczy nazwa wyświetlana. Telefon ułatwia kontakt ze sołtysem poza portalem, jeśli zdecydujesz się
            go udostępnić.
          </p>
        </details>
      </section>

      <p className="mt-8 text-sm text-stone-600">
        Szczegółowe instrukcje modułów:{" "}
        <Link href="/panel/mieszkaniec/pomoc" className="text-green-800 underline">
          pomoc — mieszkaniec
        </Link>
        {" · "}
        <Link href="/panel/soltys/pomoc" className="text-green-800 underline">
          pomoc — sołtys
        </Link>
        .
      </p>
    </main>
  );
}
