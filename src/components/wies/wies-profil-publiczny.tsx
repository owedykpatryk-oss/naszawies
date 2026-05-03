import Link from "next/link";
import {
  MarketplaceListaKlient,
  type RynekOfertaPubliczna,
} from "@/components/wies/marketplace-lista-klient";
import { KalendarzZajetosciWsiSekcja } from "@/components/swietlica/kalendarz-zajetosci-publiczny";
import type { WierszKalendarzaPublicznego } from "@/components/swietlica/kalendarz-zajetosci-publiczny";
import type { WiesPubliczna } from "@/lib/wies/znajdz-wies-po-sciezce";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { ListaZakupowWsiKlient, type PozycjaListyZakupow } from "@/components/wies/lista-zakupow-wsi-klient";
import { etykietaRodzajuWydarzenia, etykietaTypuGrupy } from "@/lib/wies/teksty-organizacji";
import { etykietaKategoriiDotacji, nazwaDniaTygodnia } from "@/lib/wies/teksty-dotacji";
import {
  SekcjaPrzewodnikSamorzadowy,
  type PrzewodnikSamorzadowyZapis,
} from "@/components/wies/sekcja-przewodnik-samorzadowy";

type WpisPostu = {
  id: string;
  title: string;
  type: string;
  created_at: string;
};

export function WiesProfilPubliczny({
  wies,
  posty,
  kalendarzZajetosci = [],
  blog = [],
  historia = [],
  rynek = [],
  wiadomosci = [],
  profileUslug = [],
  organizacje = [],
  wydarzenia = [],
  listaZakupow = [],
  mozeEdytowacListeZakupow = false,
  harmonogramTygodnia = [],
  dotacjeSkrot = [],
  przewodnikSamorzadowy = null,
}: {
  wies: WiesPubliczna;
  posty: WpisPostu[];
  kalendarzZajetosci?: WierszKalendarzaPublicznego[];
  blog?: {
    id: string;
    title: string;
    excerpt: string | null;
    published_at: string | null;
    created_at: string;
  }[];
  historia?: {
    id: string;
    title: string;
    short_description: string | null;
    event_date: string | null;
    created_at: string;
  }[];
  rynek?: RynekOfertaPubliczna[];
  wiadomosci?: {
    id: string;
    title: string;
    summary: string | null;
    category: string | null;
    source_name: string | null;
    published_at: string | null;
    created_at: string;
  }[];
  profileUslug?: {
    id: string;
    business_name: string;
    short_description: string | null;
    categories: string[] | null;
    phone: string | null;
    is_verified: boolean;
  }[];
  organizacje?: {
    id: string;
    group_type: string;
    name: string;
    short_description: string | null;
    meeting_place: string | null;
    schedule_text: string | null;
    contact_phone: string | null;
  }[];
  wydarzenia?: {
    id: string;
    event_kind: string;
    title: string;
    description: string | null;
    location_text: string | null;
    starts_at: string;
    ends_at: string | null;
    nazwa_grupy: string | null;
  }[];
  listaZakupow?: PozycjaListyZakupow[];
  mozeEdytowacListeZakupow?: boolean;
  harmonogramTygodnia?: {
    id: string;
    day_of_week: number;
    time_start: string;
    time_end: string | null;
    title: string;
    description: string | null;
    nazwa_grupy: string | null;
  }[];
  dotacjeSkrot?: {
    id: string;
    category: string;
    title: string;
    summary: string | null;
    application_deadline: string | null;
  }[];
  przewodnikSamorzadowy?: PrzewodnikSamorzadowyZapis | null;
}) {
  const sciezka = sciezkaProfiluWsi(wies);
  const prefixOgloszenia = `${sciezka}/ogloszenie`;

  return (
    <article>
      {wies.cover_image_url ? (
        <div className="relative mb-8 aspect-[21/9] max-h-64 overflow-hidden rounded-xl border border-stone-200 bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wies.cover_image_url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      <header className="border-b border-stone-200 pb-6">
        <p className="text-sm text-stone-500">
          {wies.voivodeship} · {wies.county} · {wies.commune}
          {wies.is_active ? null : (
            <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-900">
              Profil w przygotowaniu
            </span>
          )}
        </p>
        <h1 className="mt-2 font-serif text-3xl text-green-950">{wies.name}</h1>
        {wies.website ? (
          <p className="mt-3 text-sm">
            <a
              href={wies.website}
              className="text-green-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Strona gminy / sołectwa
            </a>
          </p>
        ) : null}
        {wies.latitude != null && wies.longitude != null ? (
          <p className="mt-2 text-xs text-stone-500">
            Współrzędne: {Number(wies.latitude).toFixed(5)}, {Number(wies.longitude).toFixed(5)} ·{" "}
            <a
              href={`https://www.openstreetmap.org/?mlat=${wies.latitude}&mlon=${wies.longitude}&zoom=14`}
              className="text-green-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Otwórz na mapie
            </a>
          </p>
        ) : null}
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
          <Link href={`${sciezka}/szukaj`} className="text-green-800 underline">
            Szukaj na stronie wsi
          </Link>
          {wies.updated_at ? (
            <span>
              Katalog wsi zaktualizowany: {new Date(wies.updated_at).toLocaleDateString("pl-PL")}
            </span>
          ) : null}
        </p>
      </header>

      {wies.description ? (
        <section className="mt-8">
          <h2 className="font-serif text-xl text-green-950">O miejscowości</h2>
          <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">{wies.description}</div>
        </section>
      ) : null}

      <SekcjaPrzewodnikSamorzadowy wies={wies} przewodnik={przewodnikSamorzadowy} />

      <section className="mt-10">
        <h2 className="font-serif text-xl text-green-950">Ogłoszenia i oferty</h2>
        <p className="mt-1 text-sm text-stone-600">
          Na publicznym profilu widać m.in. zatwierdzone oferty typu „targ lokalny”. Pozostałe treści — po zalogowaniu,
          jeśli masz rolę mieszkańca w tej wsi.
        </p>
        {posty.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Brak publicznych wpisów do wyświetlenia.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {posty.map((p) => (
              <li key={p.id}>
                <Link
                  href={`${prefixOgloszenia}/${p.id}`}
                  className="block rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-green-300 hover:bg-green-50/40"
                >
                  <p className="font-medium text-stone-900">{p.title}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {p.type} · {new Date(p.created_at).toLocaleDateString("pl-PL")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl text-green-950">Blog i kronika mieszkańców</h2>
        <p className="mt-1 text-sm text-stone-600">
          Lokalne wpisy blogerów oraz materiały o historii miejscowości dodawane przez społeczność i zatwierdzane przez
          sołtysa.
        </p>
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
          <Link href={`${sciezka}/blog`} className="text-green-800 underline">
            Zobacz wszystkie wpisy bloga
          </Link>
          <Link href={`${sciezka}/historia`} className="text-green-800 underline">
            Zobacz pełną historię wsi
          </Link>
        </p>
        {blog.length === 0 && historia.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Brak opublikowanych wpisów bloga i historii.</p>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {blog.map((w) => (
              <Link
                key={`blog-${w.id}`}
                href={`${sciezka}/blog/${w.id}`}
                className="block rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-green-300 hover:bg-green-50/40"
              >
                <p className="text-xs uppercase tracking-wide text-green-800">Blog</p>
                <p className="mt-1 font-medium text-stone-900">{w.title}</p>
                {w.excerpt ? <p className="mt-1 line-clamp-2 text-xs text-stone-600">{w.excerpt}</p> : null}
                <p className="mt-2 text-xs text-stone-500">
                  {new Date(w.published_at ?? w.created_at).toLocaleDateString("pl-PL")}
                </p>
              </Link>
            ))}
            {historia.map((w) => (
              <Link
                key={`historia-${w.id}`}
                href={`${sciezka}/historia/${w.id}`}
                className="block rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-green-300 hover:bg-green-50/40"
              >
                <p className="text-xs uppercase tracking-wide text-amber-700">Historia wsi</p>
                <p className="mt-1 font-medium text-stone-900">{w.title}</p>
                {w.short_description ? <p className="mt-1 line-clamp-2 text-xs text-stone-600">{w.short_description}</p> : null}
                <p className="mt-2 text-xs text-stone-500">
                  {w.event_date
                    ? new Date(w.event_date).toLocaleDateString("pl-PL")
                    : new Date(w.created_at).toLocaleDateString("pl-PL")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl text-green-950">Koła, kluby i kalendarz wydarzeń</h2>
        <p className="mt-1 text-sm text-stone-600">
          Koła Gospodyń, sekcje sportowe, zespoły — oraz zbliżające się mecze, wyjazdy, próby i festyny. Pełna lista:{" "}
          <Link href={`${sciezka}/wydarzenia`} className="text-green-800 underline">
            kalendarz wydarzeń
          </Link>
          .
        </p>
        {organizacje.length === 0 && wydarzenia.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Brak opublikowanych organizacji i wydarzeń.</p>
        ) : (
          <div className="mt-5 grid gap-6 lg:grid-cols-2">
            {organizacje.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Organizacje</h3>
                <ul className="mt-3 space-y-3">
                  {organizacje.map((o) => (
                    <li key={o.id} className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
                      <p className="text-xs text-rose-800">{etykietaTypuGrupy(o.group_type)}</p>
                      <p className="mt-1 font-medium text-stone-900">{o.name}</p>
                      {o.short_description ? <p className="mt-1 text-sm text-stone-700">{o.short_description}</p> : null}
                      {o.meeting_place ? (
                        <p className="mt-2 text-xs text-stone-600">
                          <span className="font-medium">Miejsce:</span> {o.meeting_place}
                        </p>
                      ) : null}
                      {o.schedule_text ? (
                        <p className="mt-1 text-xs text-stone-600">
                          <span className="font-medium">Terminy:</span> {o.schedule_text}
                        </p>
                      ) : null}
                      {o.contact_phone ? (
                        <p className="mt-2 text-xs text-stone-500">Tel. {o.contact_phone}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-stone-500 lg:col-span-1">Brak zapisanych organizacji.</p>
            )}
            {wydarzenia.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Nadchodzące wydarzenia</h3>
                <ul className="mt-3 space-y-3">
                  {wydarzenia.map((ev) => (
                    <li key={ev.id}>
                      <Link
                        href={`${sciezka}/wydarzenia/${ev.id}`}
                        className="block rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50/40"
                      >
                        <p className="text-xs text-indigo-800">
                          {etykietaRodzajuWydarzenia(ev.event_kind)}
                          {ev.nazwa_grupy ? ` · ${ev.nazwa_grupy}` : ""}
                        </p>
                        <p className="mt-1 font-medium text-stone-900">{ev.title}</p>
                        <p className="mt-2 text-xs text-stone-600">
                          {new Date(ev.starts_at).toLocaleString("pl-PL", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                          {ev.ends_at
                            ? ` – ${new Date(ev.ends_at).toLocaleTimeString("pl-PL", { timeStyle: "short" })}`
                            : null}
                          {ev.location_text ? ` · ${ev.location_text}` : ""}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-stone-500">Brak zaplanowanych wydarzeń w najbliższym oknie.</p>
            )}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl text-green-950">Lista zakupów (KGW i sąsiedzi)</h2>
        <p className="mt-1 text-sm text-stone-600">
          Wspólna lista na imprezy i codzienne gotowanie — każdy może dopisać produkt i zaznaczyć, co już kupiono.
        </p>
        <ListaZakupowWsiKlient
          villageId={wies.id}
          pozycje={listaZakupow}
          edytowalna={Boolean(mozeEdytowacListeZakupow)}
          pokazSzablony={Boolean(mozeEdytowacListeZakupow)}
          pokazDruk={listaZakupow.length > 0}
        />
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl text-green-950">Plan stałych zajęć (tydzień)</h2>
        <p className="mt-1 text-sm text-stone-600">
          Powtarzalne terminy (próby, zajęcia w świetlicy) — uzupełnia sołtys. Jednorazowe wydarzenia są w{" "}
          <Link href={`${sciezka}/wydarzenia`} className="text-green-800 underline">
            kalendarzu
          </Link>
          .
        </p>
        {harmonogramTygodnia.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Brak zapisanego tygodniowego harmonogramu.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {harmonogramTygodnia.map((s) => (
              <li key={s.id} className="rounded-lg border border-teal-200/70 bg-teal-50/30 px-3 py-2 text-sm">
                <span className="font-medium text-teal-950">{nazwaDniaTygodnia(s.day_of_week)}</span>
                <span className="text-stone-700">
                  {" "}
                  {s.time_start.slice(0, 5)}
                  {s.time_end ? `–${s.time_end.slice(0, 5)}` : ""} — {s.title}
                  {s.nazwa_grupy ? ` · ${s.nazwa_grupy}` : ""}
                </span>
                {s.description ? <p className="mt-1 text-xs text-stone-600">{s.description}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl text-green-950">Możliwe źródła dofinansowania</h2>
        <p className="mt-1 text-sm text-stone-600">
          Informacje zebrane przez sołtysa (programy, nabory, linki) — bez porady prawnej; warto zweryfikować warunki u
          wnioskodawcy lub w BIP gminy.
        </p>
        {dotacjeSkrot.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Brak wpisów o dotacjach i grantach.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {dotacjeSkrot.map((d) => (
              <li key={d.id}>
                <Link
                  href={`${sciezka}/dotacje/${d.id}`}
                  className="block rounded-xl border border-emerald-200/80 bg-white px-4 py-3 shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50/40"
                >
                  <p className="text-xs text-emerald-900">{etykietaKategoriiDotacji(d.category)}</p>
                  <p className="mt-1 font-medium text-stone-900">{d.title}</p>
                  {d.summary ? <p className="mt-1 line-clamp-2 text-xs text-stone-600">{d.summary}</p> : null}
                  {d.application_deadline ? (
                    <p className="mt-2 text-xs text-stone-500">
                      Termin naboru: {new Date(d.application_deadline).toLocaleDateString("pl-PL")}
                    </p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-stone-500">
          <Link href={`${sciezka}/dotacje`} className="text-green-800 underline">
            Wszystkie zapisy o dofinansowaniu
          </Link>
        </p>
      </section>

      <section id="sekcja-rynek-lokalny" className="mt-10 scroll-mt-8">
        <h2 className="font-serif text-xl text-green-950">Darmowy rynek lokalny</h2>
        <p className="mt-1 text-sm text-stone-600">
          Publiczne oferty mieszkańców i lokalnych usługodawców. Publikacja jest bezpłatna, a wygasłe wpisy archiwizują
          się automatycznie.
        </p>
        {profileUslug.length === 0 && rynek.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Brak aktywnych ofert i profili usług.</p>
        ) : (
          <>
            {profileUslug.length > 0 ? (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {profileUslug.map((p) => (
                  <li key={p.id} className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
                    <p className="font-medium text-stone-900">{p.business_name}</p>
                    <p className="mt-1 text-xs text-stone-600">{p.short_description ?? "Profil usług lokalnych."}</p>
                    <p className="mt-2 text-xs text-stone-500">
                      {(p.categories ?? []).slice(0, 3).join(" · ") || "Usługi lokalne"}
                      {p.phone ? ` · tel. ${p.phone}` : ""}
                      {p.is_verified ? " · zweryfikowany" : ""}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}

            {rynek.length > 0 ? <MarketplaceListaKlient oferty={rynek} /> : null}
          </>
        )}
      </section>

      <section id="sekcja-wiadomosci-lokalne" className="mt-10 scroll-mt-8">
        <h2 className="font-serif text-xl text-green-950">Lokalne wiadomości</h2>
        <p className="mt-1 text-sm text-stone-600">
          Krótkie aktualności o sprawach ważnych dla mieszkańców. Część wpisów może być tworzona automatycznie i
          zatwierdzana przez moderatora.
        </p>
        {wiadomosci.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">Brak opublikowanych wiadomości lokalnych.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {wiadomosci.map((w) => (
              <li key={w.id} className="rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm">
                <p className="font-medium text-stone-900">{w.title}</p>
                {w.summary ? <p className="mt-1 text-sm text-stone-700">{w.summary}</p> : null}
                <p className="mt-2 text-xs text-stone-500">
                  {w.category ?? "aktualność"}
                  {w.source_name ? ` · źródło: ${w.source_name}` : ""}
                  {" · "}
                  {new Date(w.published_at ?? w.created_at).toLocaleDateString("pl-PL")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {wies.is_active ? <KalendarzZajetosciWsiSekcja wies={{ name: wies.name }} wiersze={kalendarzZajetosci} /> : null}

      <section className="mt-10 rounded-xl border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-700">
        <p className="font-medium text-stone-900">Świetlica i rezerwacje</p>
        <p className="mt-2">
          Rezerwacja sali odbywa się w{" "}
          <Link href="/logowanie?next=/panel/mieszkaniec/swietlica" className="text-green-800 underline">
            panelu mieszkańca
          </Link>{" "}
          (po akceptacji roli we wsi). Kto zajął salę w danym terminie — tylko sołtys w panelu obiegu; powyżej
          widać wyłącznie że przedział jest zajęty, bez danych osobowych.
        </p>
        {wies.teryt_id === "0088390" ? (
          <p className="mt-4 border-t border-stone-200 pt-4">
            <Link
              href={`${sciezka}/projekt-swietlicy`}
              className="inline-flex items-center gap-2 rounded-lg bg-green-800 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-900"
            >
              Zobacz projekt świetlicy (rzut, elewacje, powierzchnie)
            </Link>
          </p>
        ) : null}
      </section>
    </article>
  );
}
