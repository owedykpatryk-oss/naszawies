import Link from "next/link";
import { KartaKlubuSportowego } from "@/components/wies/karta-klubu-sportowego";
import { OrganizacjaTeaserKafel } from "@/components/wies/organizacja/organizacja-teaser-kafel";
import { NastepnyWydarzenieSportBaner } from "@/components/wies/nastepny-wydarzenie-sport-baner";
import { OslonaSekcjiWies, KARTA_LISTY_WIES } from "@/components/wies/oslona-sekcji-wies";
import { PrzewinDoSekcjiKlient } from "@/components/wies/przewin-do-sekcji-klient";
import { QrTerminarzSportuKlient } from "@/components/wies/qr-terminarz-sportu-klient";
import { TytulSekcjiWies } from "@/components/wies/tytul-sekcji-wies";
import { UdostepnijSportWsiKlient } from "@/components/wies/udostepnij-sport-wsi-klient";
import { UjawnijPoPrzewinieciu } from "@/components/ui/ujawnij-po-przewinieciu";
import { parsujProfilKlubuSportowego } from "@/lib/wies/profil-klubu-sportowego";
import { hasloOrganizacjiZProfilu, okladkaOrganizacjiZProfilu } from "@/lib/wies/profil-organizacji-meta";
import { znajdzNastepneWydarzenieSportowe } from "@/lib/wies/pobierz-terminarz-sportu-wsi";
import { urlIcalSportuWsi, urlRssSportuWsi } from "@/lib/wies/rss-sportu";
import { nazwaDniaTygodnia } from "@/lib/wies/teksty-dotacji";
import { etykietaRodzajuWydarzenia } from "@/lib/wies/teksty-organizacji";
import {
  czySlotHarmonogramuSportowego,
  czyWydarzenieSportowe,
  nazwyKlubowSportowych,
  type OrganizacjaSportowaSkrot,
} from "@/lib/wies/sport";

type Wydarzenie = {
  id: string;
  event_kind: string;
  title: string;
  description?: string | null;
  location_text: string | null;
  starts_at: string;
  ends_at?: string | null;
  nazwa_grupy?: string | null;
};

type Slot = {
  id: string;
  day_of_week: number;
  time_start: string;
  time_end: string | null;
  title: string;
  description: string | null;
  nazwa_grupy: string | null;
};

type Props = {
  kluby: OrganizacjaSportowaSkrot[];
  klubyPelne: Array<{
    id: string;
    name: string;
    group_type: string;
    public_slug?: string | null;
    short_description: string | null;
    meeting_place: string | null;
    schedule_text: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    profile_data?: unknown;
  }>;
  wydarzenia: Wydarzenie[];
  harmonogram: Slot[];
  sciezkaProfilu: string;
  nazwaWsi: string;
  villageId: string;
  linkBoiskoNaMapie?: string | null;
  przewinPrzyWejsciu?: boolean;
  sciezkaPelnejStronyKlubu?: (klub: { id: string; name: string; group_type: string; public_slug?: string | null }) => string | null;
};

export function SekcjaSportPubliczna({
  kluby,
  klubyPelne,
  wydarzenia,
  harmonogram,
  sciezkaProfilu,
  nazwaWsi,
  villageId,
  linkBoiskoNaMapie = null,
  przewinPrzyWejsciu = false,
  sciezkaPelnejStronyKlubu,
}: Props) {
  const nazwy = nazwyKlubowSportowych(kluby);
  const treningi = harmonogram.filter((s) => czySlotHarmonogramuSportowego(s.nazwa_grupy, nazwy));
  const terminarz = wydarzenia
    .filter((ev) => czyWydarzenieSportowe(ev.event_kind, ev.nazwa_grupy, nazwy))
    .slice(0, 12);
  const sciezkaWydarzenia = `${sciezkaProfilu}/wydarzenia`;
  const rssUrl = urlRssSportuWsi(villageId);
  const icalUrl = urlIcalSportuWsi(villageId);
  const nastepne = znajdzNastepneWydarzenieSportowe(
    terminarz.map((ev) => ({
      id: ev.id,
      title: ev.title,
      description: ev.description ?? null,
      event_kind: ev.event_kind,
      location_text: ev.location_text,
      starts_at: ev.starts_at,
      ends_at: ev.ends_at ?? null,
      nazwa_grupy: ev.nazwa_grupy ?? null,
    })),
  );

  return (
    <OslonaSekcjiWies id="sekcja-sport" wariant="sport">
      <PrzewinDoSekcjiKlient id="sekcja-sport" wlacz={przewinPrzyWejsciu} />
      <TytulSekcjiWies
        wariant="sport"
        etykieta="Sport"
        tytul="Klub i terminarz"
        opis="Stałe treningi w tygodniu, mecze i wyjazdy — gdzie, kiedy i z kim grają nasi."
      />
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
        <Link href={`${sciezkaWydarzenia}?sport=1`} className="font-medium text-sky-900 underline">
          Kalendarz sportowy
        </Link>
        <Link href={`${sciezkaProfilu}/sport`} className="font-medium text-sky-900 underline">
          Pełny terminarz
        </Link>
        <a href={rssUrl} className="font-medium text-sky-900 underline" title="Kanał RSS meczów i treningów">
          RSS
        </a>
        <a href={icalUrl} className="font-medium text-sky-900 underline" title="Kalendarz iCal (.ics)">
          iCal
        </a>
        {linkBoiskoNaMapie ? (
          <Link href={linkBoiskoNaMapie} className="font-medium text-sky-900 underline">
            Boisko na mapie
          </Link>
        ) : null}
      </p>

      {nastepne ? <NastepnyWydarzenieSportBaner wydarzenie={nastepne} sciezkaProfilu={sciezkaProfilu} /> : null}

      <UdostepnijSportWsiKlient sciezkaProfilu={sciezkaProfilu} nazwaWsi={nazwaWsi} />

      {klubyPelne.some((k) => sciezkaPelnejStronyKlubu?.(k)) ? (
        <div className="organizacja-teaser-grid mt-5 grid gap-4 sm:grid-cols-2">
          {klubyPelne.map((k) => {
            const href = sciezkaPelnejStronyKlubu?.(k);
            if (!href) return null;
            const profil = parsujProfilKlubuSportowego(k.profile_data);
            const nastepneKlub = terminarz.find((ev) =>
              czyWydarzenieSportowe(ev.event_kind, ev.nazwa_grupy ?? k.name, nazwy),
            );
            return (
              <UjawnijPoPrzewinieciu key={k.id} opoznienieMs={0}>
                <OrganizacjaTeaserKafel
                  segment="sport"
                  nazwa={k.name}
                  opis={k.short_description}
                  href={href}
                  okladkaUrl={okladkaOrganizacjiZProfilu(k.profile_data)}
                  haslo={hasloOrganizacjiZProfilu(k.profile_data)}
                  podpis={profil?.trener ? `Trener: ${profil.trener}` : profil?.dyscyplina ?? null}
                  badge={
                    nastepneKlub
                      ? new Date(nastepneKlub.starts_at).toLocaleDateString("pl-PL", {
                          day: "numeric",
                          month: "short",
                        })
                      : null
                  }
                />
              </UjawnijPoPrzewinieciu>
            );
          })}
        </div>
      ) : null}

      {klubyPelne.map((k) => (
        <div key={k.id} className="mt-5">
          <KartaKlubuSportowego
            klub={{
              id: k.id,
              name: k.name,
              short_description: k.short_description,
              meeting_place: k.meeting_place,
              schedule_text: k.schedule_text,
              contact_phone: k.contact_phone,
              contact_email: k.contact_email,
              profil: parsujProfilKlubuSportowego(k.profile_data),
            }}
            sciezkaProfilu={sciezkaProfilu}
            sciezkaWydarzenia={sciezkaWydarzenia}
            linkBoiskoNaMapie={linkBoiskoNaMapie}
            nadchodzaceWydarzenia={terminarz
              .filter((ev) => czyWydarzenieSportowe(ev.event_kind, ev.nazwa_grupy ?? k.name, nazwy))
              .slice(0, 4)
              .map((ev) => ({
                id: ev.id,
                event_kind: ev.event_kind,
                title: ev.title,
                location_text: ev.location_text,
                starts_at: ev.starts_at,
              }))}
            sciezkaPelnejStrony={sciezkaPelnejStronyKlubu?.(k) ?? undefined}
          />
        </div>
      ))}

      {treningi.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-sky-900/80">Plan treningów (tydzień)</h3>
          <ul className="mt-3 space-y-2">
            {treningi.map((s) => (
              <li key={s.id} className={`${KARTA_LISTY_WIES} border-sky-200/70 bg-sky-50/40`}>
                <span className="font-medium text-sky-950">{nazwaDniaTygodnia(s.day_of_week)}</span>
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
        </div>
      ) : null}

      {terminarz.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Nadchodzące mecze i zawody</h3>
          <ul className="mt-3 space-y-2">
            {terminarz.map((ev) => (
              <li key={ev.id}>
                <Link
                  href={`${sciezkaProfilu}/wydarzenia/${ev.id}`}
                  className={`${KARTA_LISTY_WIES} block hover:border-sky-300 hover:bg-sky-50/40`}
                >
                  <p className="text-xs text-sky-800">
                    {etykietaRodzajuWydarzenia(ev.event_kind)}
                    {ev.nazwa_grupy ? ` · ${ev.nazwa_grupy}` : ""}
                  </p>
                  <p className="mt-1 font-medium text-stone-900">{ev.title}</p>
                  <p className="mt-1 text-xs text-stone-600">
                    {new Date(ev.starts_at).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" })}
                    {ev.location_text ? ` · ${ev.location_text}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <UjawnijPoPrzewinieciu>
        <div className="mt-8">
          <QrTerminarzSportuKlient nazwaWsi={nazwaWsi} sciezkaProfilu={sciezkaProfilu} />
        </div>
      </UjawnijPoPrzewinieciu>
    </OslonaSekcjiWies>
  );
}
