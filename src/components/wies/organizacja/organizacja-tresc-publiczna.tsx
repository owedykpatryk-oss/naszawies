import Link from "next/link";
import {
  KartaKgwPubliczna,
  type DaneKgwPubliczne,
  type WydarzenieKgwSkrot,
} from "@/components/wies/karta-kgw-publiczna";
import {
  KartaMysliwiPubliczna,
  type DaneMysliwiPubliczne,
  type OstrzezenieLowieckieSkrot,
  type WydarzenieLowieckieSkrot,
} from "@/components/wies/karta-mysliwi-publiczna";
import {
  KartaParafiiPubliczna,
  type DaneParafiiPubliczne,
  type WydarzenieParafialneSkrot,
} from "@/components/wies/karta-parafii-publiczna";
import {
  KartaOspPubliczna,
  type DaneOspPubliczne,
  type WydarzenieOspSkrot,
} from "@/components/wies/karta-osp-publiczna";
import {
  KartaKlubuSportowego,
  type DaneKlubuSportowego,
  type WydarzenieSportoweSkrot,
} from "@/components/wies/karta-klubu-sportowego";
import type { WpisKalendarzaLowieckiego } from "@/lib/lowiectwo/kalendarz-lowiecki";
import type { SegmentOrganizacji } from "@/lib/wies/sciezka-organizacji-publicznej";
import {
  parsujProfilKgw,
  parsujProfilLowiecki,
  parsujProfilOsp,
  parsujProfilParafii,
} from "@/lib/wies/profil-organizacji";
import { parsujProfilKlubuSportowego } from "@/lib/wies/profil-klubu-sportowego";
import type { WierszOrganizacjiPublicznej } from "@/lib/wies/pobierz-strone-organizacji";
import { ParafiaIntencjeTygodnia } from "@/components/wies/organizacja/parafia-intencje-tygodnia";
import { etykietaRodzajuWydarzenia } from "@/lib/wies/teksty-organizacji";

type WydarzenieOrg = {
  id: string;
  event_kind: string;
  title: string;
  location_text: string | null;
  starts_at: string;
  ends_at: string | null;
  description: string | null;
};

type Props = {
  segment: SegmentOrganizacji;
  org: WierszOrganizacjiPublicznej;
  sciezkaWsi: string;
  sciezkaWydarzenia: string;
  sciezkaDotacje?: string;
  sciezkaRynek?: string;
  wydarzenia: WydarzenieOrg[];
  zalogowany?: boolean;
  mieszkaniecWsi?: boolean;
  harmonogramLowiecki?: WpisKalendarzaLowieckiego[];
  ostrzezeniaLowieckie?: OstrzezenieLowieckieSkrot[];
  linkMiejsceNaMapie?: string | null;
  linkKosciolNaMapie?: string | null;
  linkCmentarzNaMapie?: string | null;
  linkRemizaNaMapie?: string | null;
  linkBoiskoNaMapie?: string | null;
  linkPlanCmentarza?: string | null;
};

function grupujWydarzeniaPoMiesiacu(wydarzenia: WydarzenieOrg[]): { etykieta: string; wpisy: WydarzenieOrg[] }[] {
  const map = new Map<string, WydarzenieOrg[]>();
  for (const w of wydarzenia) {
    const etykieta = new Date(w.starts_at).toLocaleDateString("pl-PL", { month: "long", year: "numeric" });
    const lista = map.get(etykieta) ?? [];
    lista.push(w);
    map.set(etykieta, lista);
  }
  return Array.from(map.entries()).map(([etykieta, wpisy]) => ({ etykieta, wpisy }));
}

function ListaWydarzenPoMiesiacu({
  wydarzenia,
  sciezkaWydarzenia,
  pusta,
}: {
  wydarzenia: WydarzenieOrg[];
  sciezkaWydarzenia: string;
  pusta: string;
}) {
  if (wydarzenia.length === 0) {
    return <OrganizacjaPustyStan ikona="📅" tekst={pusta} />;
  }
  const grupy = grupujWydarzeniaPoMiesiacu(wydarzenia);
  return (
    <div className="space-y-5">
      {grupy.map((g) => (
        <section key={g.etykieta}>
          <h3 className="organizacja-kalendarz-miesiac capitalize">{g.etykieta}</h3>
          <ul className="mt-2 space-y-2">
            {g.wpisy.map((ev) => (
              <li key={ev.id}>
                <Link
                  href={`${sciezkaWydarzenia}/${ev.id}`}
                  className="organizacja-kalendarz-wpis block rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-green-300 hover:bg-green-50/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium text-stone-900">{ev.title}</p>
                    <time className="shrink-0 text-xs font-semibold text-green-800">
                      {new Date(ev.starts_at).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
                    </time>
                  </div>
                  <p className="mt-1 text-xs text-stone-600">
                    {etykietaRodzajuWydarzenia(ev.event_kind)} ·{" "}
                    {new Date(ev.starts_at).toLocaleTimeString("pl-PL", { timeStyle: "short" })}
                    {ev.location_text ? ` · ${ev.location_text}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function OrganizacjaPustyStan({ ikona, tekst }: { ikona: string; tekst: string }) {
  return (
    <div className="organizacja-pusty-stan" role="status">
      <span className="organizacja-pusty-stan__ikona" aria-hidden>
        {ikona}
      </span>
      <p className="organizacja-pusty-stan__tekst">{tekst}</p>
    </div>
  );
}

function ListaWydarzen({
  wydarzenia,
  sciezkaWydarzenia,
  pusta,
}: {
  wydarzenia: WydarzenieOrg[];
  sciezkaWydarzenia: string;
  pusta: string;
}) {
  if (wydarzenia.length === 0) {
    return <OrganizacjaPustyStan ikona="📅" tekst={pusta} />;
  }
  return (
    <ul className="space-y-2">
      {wydarzenia.map((ev) => (
        <li key={ev.id}>
          <Link
            href={`${sciezkaWydarzenia}/${ev.id}`}
            className="block rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-green-300 hover:bg-green-50/40"
          >
            <p className="font-medium text-stone-900">{ev.title}</p>
            <p className="mt-1 text-xs text-stone-600">
              {etykietaRodzajuWydarzenia(ev.event_kind)} ·{" "}
              {new Date(ev.starts_at).toLocaleString("pl-PL", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {ev.location_text ? ` · ${ev.location_text}` : ""}
            </p>
            {ev.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-stone-500">{ev.description}</p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function OrganizacjaZakladkaStart({
  org,
  segment,
  wydarzenia,
  sciezkaWydarzenia,
  linkMiejsceNaMapie,
  etykietaLinkMapy,
  linkCmentarzNaMapie,
  linkPlanCmentarza,
}: Pick<Props, "org" | "wydarzenia" | "sciezkaWydarzenia" | "linkMiejsceNaMapie"> & {
  segment: SegmentOrganizacji;
  etykietaLinkMapy?: string | null;
  linkCmentarzNaMapie?: string | null;
  linkPlanCmentarza?: string | null;
}) {
  const nadchodzace = wydarzenia.filter((w) => new Date(w.ends_at ?? w.starts_at) >= new Date()).slice(0, 3);
  const profilParafii = segment === "parafia" ? parsujProfilParafii(org.profile_data) : null;
  const intencje = profilParafii?.intencje_tygodniowe;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="organizacja-karta-start">
          <h2 className="flex items-center gap-2 font-serif text-lg text-green-950">
            <span aria-hidden className="text-base opacity-70">
              📋
            </span>
            W skrócie
          </h2>
          {segment === "parafia" && profilParafii?.msze_niedziele ? (
            <div className="mt-2 rounded-lg border border-violet-100 bg-violet-50/50 p-3 text-sm text-stone-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-800">Msze niedzielne</p>
              <p className="mt-1 whitespace-pre-wrap">{profilParafii.msze_niedziele}</p>
            </div>
          ) : null}
          {org.schedule_text ? (
            <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">{org.schedule_text}</p>
          ) : segment !== "parafia" || !profilParafii?.msze_niedziele ? (
            <p className="mt-2 text-sm text-stone-500">Terminy uzupełnia sołtys w panelu społeczności.</p>
          ) : null}
          {org.meeting_place ? (
            <p className="mt-3 text-sm text-stone-700">
              <span className="font-medium">Miejsce:</span> {org.meeting_place}
            </p>
          ) : null}
          {(linkMiejsceNaMapie || linkCmentarzNaMapie || linkPlanCmentarza) ? (
            <p className="mt-3 flex flex-wrap gap-2">
              {linkMiejsceNaMapie ? (
                <Link
                  href={linkMiejsceNaMapie}
                  className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50/80 px-3 py-1 text-xs font-semibold text-green-900 transition hover:border-green-300 hover:bg-green-100"
                >
                  <span aria-hidden>📍</span>
                  {etykietaLinkMapy ?? "Zobacz na mapie wsi"}
                </Link>
              ) : null}
              {segment === "parafia" && linkCmentarzNaMapie && linkCmentarzNaMapie !== linkMiejsceNaMapie ? (
                <Link
                  href={linkCmentarzNaMapie}
                  className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50/80 px-3 py-1 text-xs font-semibold text-violet-900 transition hover:border-violet-300 hover:bg-violet-100"
                >
                  <span aria-hidden>🪦</span>
                  Cmentarz na mapie ↗
                </Link>
              ) : null}
              {segment === "parafia" && linkPlanCmentarza ? (
                <Link
                  href={linkPlanCmentarza}
                  className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50/90 px-3 py-1 text-xs font-semibold text-stone-800 transition hover:border-stone-300 hover:bg-stone-100"
                >
                  <span aria-hidden>🗺</span>
                  Plan cmentarza ↗
                </Link>
              ) : null}
            </p>
          ) : null}
        </div>
        <div className="organizacja-karta-start">
          <h2 className="flex items-center gap-2 font-serif text-lg text-green-950">
            <span aria-hidden className="text-base opacity-70">
              📅
            </span>
            Najbliższe terminy
          </h2>
          <div className="mt-3">
            <ListaWydarzen
              wydarzenia={nadchodzace}
              sciezkaWydarzenia={sciezkaWydarzenia}
              pusta="Brak zaplanowanych wydarzeń — sprawdź później."
            />
          </div>
        </div>
      </div>

      {segment === "parafia" && intencje && intencje.length > 0 ? (
        <div className="organizacja-karta-start">
          <h2 className="flex items-center gap-2 font-serif text-lg text-violet-950">
            <span aria-hidden className="text-base opacity-70">
              🕯
            </span>
            Intencje mszalne — ten tydzień
          </h2>
          <div className="mt-3">
            <ParafiaIntencjeTygodnia intencje={intencje} kompakt />
          </div>
          <p className="mt-3 text-xs text-violet-800">
            <a href="#o-nas" className="font-semibold underline">
              Pełny rozkład mszy i intencje →
            </a>
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function OrganizacjaZakladkaKontakt({ org }: Pick<Props, "org">) {
  return (
    <div className="max-w-xl rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="font-serif text-lg text-green-950">Kontakt</h2>
      <dl className="mt-4 space-y-3 text-sm">
        {org.contact_phone ? (
          <div>
            <dt className="font-medium text-stone-800">Telefon</dt>
            <dd>
              <a href={`tel:${org.contact_phone.replace(/\s/g, "")}`} className="text-green-800 underline">
                {org.contact_phone}
              </a>
            </dd>
          </div>
        ) : null}
        {org.contact_email ? (
          <div>
            <dt className="font-medium text-stone-800">E-mail</dt>
            <dd>
              <a href={`mailto:${org.contact_email}`} className="text-green-800 underline">
                {org.contact_email}
              </a>
            </dd>
          </div>
        ) : null}
        {org.meeting_place ? (
          <div>
            <dt className="font-medium text-stone-800">Siedziba / miejsce spotkań</dt>
            <dd className="text-stone-700">{org.meeting_place}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}

export function OrganizacjaTrescPubliczna(props: Props) {
  const {
    segment,
    org,
    sciezkaWsi,
    sciezkaWydarzenia,
    sciezkaDotacje,
    sciezkaRynek,
    wydarzenia,
    zalogowany,
    mieszkaniecWsi,
    harmonogramLowiecki,
    ostrzezeniaLowieckie,
    linkMiejsceNaMapie,
    linkKosciolNaMapie,
    linkCmentarzNaMapie,
    linkRemizaNaMapie,
    linkBoiskoNaMapie,
    linkPlanCmentarza,
  } = props;

  const nadchodzace = wydarzenia.slice(0, 8);

  if (segment === "kgw") {
    const kgw: DaneKgwPubliczne = {
      id: org.id,
      name: org.name,
      short_description: org.short_description,
      meeting_place: org.meeting_place,
      schedule_text: org.schedule_text,
      contact_phone: org.contact_phone,
      contact_email: org.contact_email,
      profil: parsujProfilKgw(org.profile_data),
    };
    return (
      <KartaKgwPubliczna
        kgw={kgw}
        sciezkaProfilu={sciezkaWsi}
        sciezkaWydarzenia={sciezkaWydarzenia}
        sciezkaDotacje={sciezkaDotacje}
        sciezkaRynek={sciezkaRynek}
        linkMiejsceNaMapie={linkMiejsceNaMapie}
        nadchodzaceWydarzenia={nadchodzace as WydarzenieKgwSkrot[]}
        trybOsadzony
      />
    );
  }

  if (segment === "lowiectwo") {
    const kolo: DaneMysliwiPubliczne = {
      id: org.id,
      name: org.name,
      short_description: org.short_description,
      meeting_place: org.meeting_place,
      schedule_text: org.schedule_text,
      contact_phone: org.contact_phone,
      contact_email: org.contact_email,
      profil: parsujProfilLowiecki(org.profile_data),
    };
    return (
      <KartaMysliwiPubliczna
        kolo={kolo}
        sciezkaProfilu={sciezkaWsi}
        sciezkaWydarzenia={sciezkaWydarzenia}
        zalogowany={zalogowany}
        mieszkaniecWsi={mieszkaniecWsi}
        harmonogramLowiecki={harmonogramLowiecki}
        maAktywneOstrzezenia={(ostrzezeniaLowieckie?.length ?? 0) > 0}
        ostrzezenieAktywne={ostrzezeniaLowieckie?.[0] ?? null}
        nadchodzaceWydarzenia={nadchodzace as WydarzenieLowieckieSkrot[]}
        trybOsadzony
      />
    );
  }

  if (segment === "parafia") {
    const parafia: DaneParafiiPubliczne = {
      id: org.id,
      name: org.name,
      short_description: org.short_description,
      meeting_place: org.meeting_place,
      schedule_text: org.schedule_text,
      contact_phone: org.contact_phone,
      contact_email: org.contact_email,
      profil: parsujProfilParafii(org.profile_data),
    };
    return (
      <KartaParafiiPubliczna
        parafia={parafia}
        sciezkaProfilu={sciezkaWsi}
        sciezkaWydarzenia={sciezkaWydarzenia}
        linkKosciolNaMapie={linkKosciolNaMapie ?? linkMiejsceNaMapie}
        linkCmentarzNaMapie={linkCmentarzNaMapie}
        linkPlanCmentarza={linkPlanCmentarza}
        nadchodzaceWydarzenia={nadchodzace as WydarzenieParafialneSkrot[]}
        trybOsadzony
      />
    );
  }

  if (segment === "osp") {
    const osp: DaneOspPubliczne = {
      id: org.id,
      name: org.name,
      short_description: org.short_description,
      meeting_place: org.meeting_place,
      schedule_text: org.schedule_text,
      contact_phone: org.contact_phone,
      contact_email: org.contact_email,
      profil: parsujProfilOsp(org.profile_data),
    };
    return (
      <KartaOspPubliczna
        osp={osp}
        sciezkaProfilu={sciezkaWsi}
        sciezkaWydarzenia={sciezkaWydarzenia}
        linkRemizaNaMapie={linkRemizaNaMapie ?? linkMiejsceNaMapie}
        nadchodzaceWydarzenia={nadchodzace as WydarzenieOspSkrot[]}
        trybOsadzony
      />
    );
  }

  if (segment === "sport") {
    const klub: DaneKlubuSportowego = {
      id: org.id,
      name: org.name,
      short_description: org.short_description,
      meeting_place: org.meeting_place,
      schedule_text: org.schedule_text,
      contact_phone: org.contact_phone,
      contact_email: org.contact_email,
      profil: parsujProfilKlubuSportowego(org.profile_data),
    };
    return (
      <KartaKlubuSportowego
        klub={klub}
        sciezkaProfilu={sciezkaWsi}
        sciezkaWydarzenia={sciezkaWydarzenia}
        linkBoiskoNaMapie={linkBoiskoNaMapie ?? linkMiejsceNaMapie}
        nadchodzaceWydarzenia={nadchodzace as WydarzenieSportoweSkrot[]}
        trybOsadzony
      />
    );
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-600">
      Pełny profil tej organizacji jest w przygotowaniu. Wróć na{" "}
      <Link href={sciezkaWsi} className="text-green-800 underline">
        profil wsi
      </Link>
      .
    </div>
  );
}

export function OrganizacjaZakladkaKalendarz(props: Props) {
  const { wydarzenia, sciezkaWydarzenia, segment, harmonogramLowiecki } = props;
  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-serif text-lg text-green-950">Wydarzenia</h2>
        <div className="mt-3">
          <ListaWydarzenPoMiesiacu
            wydarzenia={wydarzenia}
            sciezkaWydarzenia={sciezkaWydarzenia}
            pusta="Brak wydarzeń w kalendarzu."
          />
        </div>
      </section>
      {segment === "lowiectwo" && (harmonogramLowiecki?.length ?? 0) > 0 ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <h2 className="font-serif text-lg text-amber-950">Harmonogram łowiecki</h2>
          <p className="mt-1 text-xs text-amber-900">
            Pełne szczegóły obsady ambony — zakładka{" "}
            <a href="#mieszkancy" className="font-medium underline">
              Dla mieszkańców
            </a>
            .
          </p>
        </section>
      ) : null}
    </div>
  );
}

export function OrganizacjaZakladkaMieszkancow({
  segment,
  org,
  zalogowany,
  mieszkaniecWsi,
  harmonogramLowiecki,
  ostrzezeniaLowieckie,
}: Pick<
  Props,
  "segment" | "org" | "zalogowany" | "mieszkaniecWsi" | "harmonogramLowiecki" | "ostrzezeniaLowieckie"
>) {
  if (segment !== "lowiectwo") {
    return (
      <p className="text-sm text-stone-500">
        Ta organizacja nie udostępnia jeszcze strefy dla mieszkańców wsi.
      </p>
    );
  }

  const profil = parsujProfilLowiecki(org.profile_data);
  const maHarmonogram = (harmonogramLowiecki?.length ?? 0) > 0;
  const maInfo = Boolean(profil?.kontakt_dla_mieszkancow?.trim());

  if (!zalogowany) {
    return (
      <div className="organizacja-strefa-blokada rounded-xl border border-amber-200 bg-amber-50/60 p-5 text-sm text-amber-950">
        <p className="font-medium">Strefa dla mieszkańców wsi</p>
        <p className="mt-2 text-stone-700">
          Zaloguj się jako mieszkaniec tej wsi, aby zobaczyć harmonogram obsady ambony i komunikaty koła
          łowieckiego.
        </p>
      </div>
    );
  }

  if (!mieszkaniecWsi) {
    return (
      <div className="organizacja-strefa-blokada rounded-xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-700">
        <p className="font-medium text-stone-900">Tylko dla mieszkańców wsi</p>
        <p className="mt-2">
          Harmonogram ambony i szczegóły polowań są dostępne wyłącznie dla zweryfikowanych mieszkańców tej
          miejscowości.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(ostrzezeniaLowieckie?.length ?? 0) > 0 ? (
        <section className="rounded-xl border border-red-300 bg-red-50 p-4">
          <h2 className="font-serif text-lg text-red-950">Aktywne ostrzeżenia</h2>
          <ul className="mt-3 space-y-2">
            {(ostrzezeniaLowieckie ?? []).map((o) => (
              <li key={o.id} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm">
                <p className="font-medium text-red-950">{o.title}</p>
                <p className="mt-1 text-xs text-stone-600">
                  {new Date(o.startsAt).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" })}
                  {" – "}
                  {new Date(o.endsAt).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {maInfo ? (
        <section className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <h2 className="font-serif text-lg text-emerald-950">Informacje dla mieszkańców</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">{profil!.kontakt_dla_mieszkancow}</p>
        </section>
      ) : null}

      {maHarmonogram ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <h2 className="font-serif text-lg text-amber-950">Harmonogram obsady ambony</h2>
          <ul className="mt-3 space-y-2">
            {(harmonogramLowiecki ?? []).map((w) => (
              <li key={w.id} className="rounded-lg border border-amber-100 bg-white px-3 py-2.5 text-sm">
                <p className="font-medium text-stone-900">{w.title}</p>
                <p className="mt-1 text-xs text-stone-600">
                  {new Date(w.startsAt).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" })}
                  {w.endsAt
                    ? ` – ${new Date(w.endsAt).toLocaleTimeString("pl-PL", { timeStyle: "short" })}`
                    : ""}
                  {w.ambonaNazwa || w.standLabel ? ` · ${w.ambonaNazwa ?? w.standLabel}` : ""}
                </p>
                {w.hunterName ? (
                  <p className="mt-1 text-xs font-medium text-emerald-900">Myśliwy: {w.hunterName}</p>
                ) : null}
                {w.notes ? <p className="mt-1 text-xs text-stone-500">{w.notes}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-stone-500">Brak wpisów w harmonogramie ambony.</p>
      )}
    </div>
  );
}
