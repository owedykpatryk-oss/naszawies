"use client";

import { FormEvent, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  aktualizujOrganizacjeWsi,
  dezaktywujOrganizacjeWsi,
  dodajOrganizacjeWsi,
} from "@/app/(site)/panel/soltys/akcje";
import { etykietaTypuGrupy } from "@/lib/wies/teksty-organizacji";
import {
  czyProfilLowieckiUzupelniony,
  parsujProfilLowiecki,
  profilLowieckiZFormularza,
  type OrganizacjaPelna,
  type ProfilLowieckiJson,
} from "@/lib/wies/profil-organizacji";

const SZABLONY_ZEBRAN = [
  { etykieta: "Co miesiąc", tekst: "Zebranie koła: pierwsza środa miesiąca, godz. 18:00 — siedziba koła." },
  { etykieta: "Co kwartał", tekst: "Zebrania kwartalne — styczeń, kwiecień, lipiec, październik, godz. 17:30." },
  { etykieta: "Sezonowo", tekst: "Zebrania od września do marca — ostatni czwartek miesiąca, godz. 18:00." },
] as const;

const SZABLONY_SEZON = [
  {
    etykieta: "Standard PL",
    tekst: "Sezon łowiecki: od 1 kwietnia do 31 stycznia. Okresy ochronne zwierzyny — zgodnie z rozporządzeniem MRiRW.",
  },
  {
    etykieta: "Dla mieszkańców",
    tekst: "Polowania zbiorowe od października do stycznia — głównie w lasach i na polach uprawnych poza zabudową. W okresie lęgowym ograniczona aktywność.",
  },
] as const;

const SZABLONY_BEZPIECZENSTWO = [
  {
    etykieta: "Podstawowy",
    tekst:
      "W czasie polowań unikaj oznaczonych terenów leśnych i pól uprawnych. Psy prowadź na smyczy. Nie wchodź na teren oznaczony tablicami koła łowieckiego. W razie wątpliwości — kontakt z łowczym.",
  },
  {
    etykieta: "Dla rolników",
    tekst:
      "Przed polowaniem na polu uprawnym koło informuje właściciela. Zgłoszenia szkód w uprawach — telefon do łowczego lub prezesa (patrz kontakt poniżej).",
  },
] as const;

const SZABLONY_ZGLOSZENIE_SZKOD = [
  {
    etykieta: "Procedura",
    tekst:
      "Szkody w uprawach zgłaszaj niezwłocznie łowczemu (tel. w profilu). Sporządzany jest protokół szkody. Kontakt w godz. 8:00–20:00.",
  },
] as const;

export function ProfilMysliwiKlient({
  villageId,
  villageName,
  organizacje,
  sciezkaProfilu,
}: {
  villageId: string;
  villageName: string;
  organizacje: OrganizacjaPelna[];
  sciezkaProfilu?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [komunikat, setKomunikat] = useState<string | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const [edytujId, ustawEdytujId] = useState<string | null>(null);

  const kola = useMemo(
    () => organizacje.filter((o) => o.group_type === "lowiectwo" && o.village_id === villageId),
    [organizacje, villageId],
  );

  const edytowana = useMemo(
    () => (edytujId ? kola.find((p) => p.id === edytujId) ?? null : null),
    [edytujId, kola],
  );

  const profilEdycji = useMemo(() => parsujProfilLowiecki(edytowana?.profile_data) ?? null, [edytowana]);

  const podgladHref = sciezkaProfilu ? `${sciezkaProfilu}#mysliwi` : null;

  function run(fn: () => Promise<{ ok?: true; blad?: string }>, sukces: string) {
    setBlad(null);
    setKomunikat(null);
    startTransition(async () => {
      const w = await fn();
      if ("blad" in w && w.blad) {
        setBlad(w.blad);
        return;
      }
      setKomunikat(sukces);
      ustawEdytujId(null);
      router.refresh();
    });
  }

  function onNowa(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    run(
      () =>
        dodajOrganizacjeWsi({
          villageId,
          group_type: "lowiectwo",
          name: String(fd.get("name") ?? ""),
          short_description: String(fd.get("short_description") ?? "") || null,
          contact_phone: String(fd.get("contact_phone") ?? "") || null,
          contact_email: String(fd.get("contact_email") ?? "") || null,
          meeting_place: String(fd.get("meeting_place") ?? "") || null,
          schedule_text: String(fd.get("schedule_text") ?? "") || null,
          profile_data: profilLowieckiZFormularza(fd),
        }),
      "Dodano profil koła łowieckiego.",
    );
  }

  function onAktualizuj(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!edytujId) return;
    const fd = new FormData(e.currentTarget);
    run(
      () =>
        aktualizujOrganizacjeWsi({
          id: edytujId,
          villageId,
          group_type: "lowiectwo",
          name: String(fd.get("name") ?? ""),
          short_description: String(fd.get("short_description") ?? "") || null,
          contact_phone: String(fd.get("contact_phone") ?? "") || null,
          contact_email: String(fd.get("contact_email") ?? "") || null,
          meeting_place: String(fd.get("meeting_place") ?? "") || null,
          schedule_text: String(fd.get("schedule_text") ?? "") || null,
          profile_data: profilLowieckiZFormularza(fd),
        }),
      "Zaktualizowano profil koła łowieckiego.",
    );
  }

  function usun(id: string, nazwa: string) {
    if (!window.confirm(`Ukryć profil „${nazwa}" na stronie wsi? (można dodać ponownie).`)) return;
    run(() => dezaktywujOrganizacjeWsi(id, villageId), "Profil myśliwych został ukryty.");
  }

  return (
    <section
      id="profil-mysliwi"
      className="scroll-mt-24 rounded-2xl border border-emerald-800/30 bg-gradient-to-br from-emerald-50/60 via-white to-amber-50/30 p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-emerald-950">Profil myśliwych — {villageName}</h2>
          <p className="mt-2 max-w-prose text-sm text-stone-600">
            Obwód, kontakt, zasady bezpieczeństwa — mieszkańcy zobaczą sekcję{" "}
            <code className="rounded bg-emerald-100 px-1">#mysliwi</code> oraz powiązane ostrzeżenia polowań.
          </p>
        </div>
        {podgladHref ? (
          <Link
            href={podgladHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-emerald-400 bg-white px-3 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-50"
          >
            Podgląd publiczny ↗
          </Link>
        ) : null}
      </div>
      <p className="mt-2 text-sm">
        <Link href="/panel/soltys/lowiectwo" className="font-medium text-emerald-900 underline hover:text-emerald-950">
          Panel ostrzeżeń polowań →
        </Link>
      </p>

      {komunikat ? (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {komunikat}
        </p>
      ) : null}
      {blad ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {blad}
        </p>
      ) : null}

      <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 text-xs text-stone-700">
        <p className="font-semibold text-amber-950">Wskazówka</p>
        <p className="mt-1">
          Ostrzeżenia polowań (baner bezpieczeństwa) dodajesz w{" "}
          <Link href="/panel/soltys/lowiectwo" className="font-medium text-amber-900 underline">
            module Łowiectwo
          </Link>
          . Zebrania i polowania — jako wydarzenia typu „Zebranie koła” / „Polowanie” w zakładce Wydarzenia.
        </p>
      </div>

      {kola.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-emerald-900">Aktywne profile</h3>
          <ul className="mt-2 space-y-2">
            {kola.map((p) => {
              const profil = parsujProfilLowiecki(p.profile_data);
              const uzupelniony = czyProfilLowieckiUzupelniony(profil);
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-stone-900">{p.name}</p>
                    <p className="text-xs text-stone-500">
                      {etykietaTypuGrupy(p.group_type)}
                      {!uzupelniony ? " · profil w trakcie uzupełniania" : " · profil uzupełniony"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {podgladHref ? (
                      <Link
                        href={podgladHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50"
                      >
                        Podgląd
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => ustawEdytujId(p.id)}
                      className="rounded-lg border border-emerald-400 px-3 py-1.5 text-xs font-medium text-emerald-950 hover:bg-emerald-50"
                    >
                      Edytuj
                    </button>
                    <button
                      type="button"
                      onClick={() => usun(p.id, p.name)}
                      disabled={pending}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-800 hover:bg-red-50 disabled:opacity-60"
                    >
                      Ukryj
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <form
        onSubmit={edytowana ? onAktualizuj : onNowa}
        className="mt-6 space-y-4 rounded-xl border border-emerald-200/80 bg-white/90 p-4"
      >
        <h3 className="text-sm font-semibold text-emerald-950">
          {edytowana ? `Edycja: ${edytowana.name}` : kola.length ? "Dodaj kolejne koło" : "Nowy profil koła łowieckiego"}
        </h3>

        <PolaMysliwi
          key={edytowana?.id ?? "nowa"}
          domyslne={{
            name: edytowana?.name ?? `Koło Łowieckie ${villageName}`,
            short_description: edytowana?.short_description ?? null,
            contact_phone: edytowana?.contact_phone ?? null,
            contact_email: edytowana?.contact_email ?? null,
            meeting_place: edytowana?.meeting_place ?? null,
            schedule_text: edytowana?.schedule_text ?? null,
            profil: profilEdycji,
          }}
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending || !villageId}
            className="rounded-lg bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-950 disabled:opacity-60"
          >
            {pending ? "Zapisuję…" : edytowana ? "Zapisz zmiany" : "Dodaj profil myśliwych"}
          </button>
          {edytowana ? (
            <button
              type="button"
              onClick={() => ustawEdytujId(null)}
              className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50"
            >
              Anuluj edycję
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

function SzablonyPola({
  szablony,
  onWstaw,
}: {
  szablony: readonly { etykieta: string; tekst: string }[];
  onWstaw: (tekst: string) => void;
}) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {szablony.map((s) => (
        <button
          key={s.etykieta}
          type="button"
          onClick={() => onWstaw(s.tekst)}
          className="rounded-md border border-emerald-200 bg-emerald-50/80 px-2 py-0.5 text-[11px] font-medium text-emerald-900 hover:bg-emerald-100"
        >
          {s.etykieta}
        </button>
      ))}
    </div>
  );
}

function PolaMysliwi({
  domyslne,
}: {
  domyslne: {
    name: string;
    short_description: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    meeting_place: string | null;
    schedule_text: string | null;
    profil: ProfilLowieckiJson | null;
  };
}) {
  const p = domyslne.profil;
  const refZebrania = useRef<HTMLTextAreaElement>(null);
  const refSezon = useRef<HTMLTextAreaElement>(null);
  const refBezpieczenstwo = useRef<HTMLTextAreaElement>(null);
  const refZgloszenie = useRef<HTMLTextAreaElement>(null);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-stone-800">Nazwa koła</span>
          <input
            name="name"
            required
            defaultValue={domyslne.name}
            placeholder='np. Koło Łowieckie "..." w ...'
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Prezes</span>
          <input
            name="mysliwi_prezes"
            defaultValue={p?.prezes ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Łowczy</span>
          <input
            name="mysliwi_lowczy"
            defaultValue={p?.lowczy ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Numer koła (opcjonalnie)</span>
          <input
            name="mysliwi_numer_kola"
            defaultValue={p?.numer_kola ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-stone-800">Obwód / rejon łowiecki</span>
          <textarea
            name="mysliwi_obszar"
            rows={3}
            defaultValue={p?.obszar_lowiecki ?? ""}
            placeholder="Opis granic obwodu, lasy, pola uprawne…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-stone-800">Siedziba koła</span>
          <input
            name="mysliwi_siedziba"
            defaultValue={p?.siedziba_kola ?? domyslne.meeting_place ?? ""}
            placeholder="Adres lub opis miejsca"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Strona www</span>
          <input
            name="mysliwi_strona_www"
            type="url"
            defaultValue={p?.strona_www ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Facebook</span>
          <input
            name="mysliwi_facebook"
            defaultValue={p?.facebook ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-stone-800">Instagram</span>
          <input
            name="mysliwi_instagram"
            defaultValue={p?.instagram ?? ""}
            placeholder="https://instagram.com/…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <fieldset className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4">
        <legend className="px-1 text-xs font-bold uppercase tracking-wider text-amber-900">
          Sezon, zebrania i bezpieczeństwo
        </legend>
        <div className="mt-3 grid gap-3">
          <label className="block text-sm">
            <span className="font-medium">Zebrania koła</span>
            <textarea
              ref={refZebrania}
              name="mysliwi_zebrania"
              rows={2}
              defaultValue={p?.zebrania ?? domyslne.schedule_text ?? ""}
              placeholder="np. pierwsza środa miesiąca, godz. 18:00"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
            <SzablonyPola
              szablony={SZABLONY_ZEBRAN}
              onWstaw={(tekst) => {
                if (refZebrania.current) refZebrania.current.value = tekst;
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Sezon łowiecki</span>
            <textarea
              ref={refSezon}
              name="mysliwi_sezon"
              rows={2}
              defaultValue={p?.sezon_lowiecki ?? ""}
              placeholder="Daty sezonu, okresy ochronne…"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
            <SzablonyPola
              szablony={SZABLONY_SEZON}
              onWstaw={(tekst) => {
                if (refSezon.current) refSezon.current.value = tekst;
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Zasady bezpieczeństwa dla mieszkańców</span>
            <textarea
              ref={refBezpieczenstwo}
              name="mysliwi_bezpieczenstwo"
              rows={3}
              defaultValue={p?.zasady_bezpieczenstwa ?? ""}
              placeholder="Znaki, odległość od domów, psy na smyczy, godziny polowań…"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
            <SzablonyPola
              szablony={SZABLONY_BEZPIECZENSTWO}
              onWstaw={(tekst) => {
                if (refBezpieczenstwo.current) refBezpieczenstwo.current.value = tekst;
              }}
            />
          </label>
        </div>
      </fieldset>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">Telefon</span>
          <input
            name="contact_phone"
            type="tel"
            defaultValue={domyslne.contact_phone ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">E-mail</span>
          <input
            name="contact_email"
            type="email"
            defaultValue={domyslne.contact_email ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium">Krótki opis (widoczny na profilu)</span>
          <textarea
            name="short_description"
            rows={2}
            defaultValue={domyslne.short_description ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium">Zgłoszenie szkód w uprawach</span>
          <textarea
            ref={refZgloszenie}
            name="mysliwi_zgloszenie_szkod"
            rows={2}
            defaultValue={p?.zgloszenie_szkod ?? ""}
            placeholder="Procedura zgłaszania szkód, numer telefonu, godziny kontaktu…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
          <SzablonyPola
            szablony={SZABLONY_ZGLOSZENIE_SZKOD}
            onWstaw={(tekst) => {
              if (refZgloszenie.current) refZgloszenie.current.value = tekst;
            }}
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium">Współpraca z rolnikami</span>
          <textarea
            name="mysliwi_rolnicy"
            rows={2}
            defaultValue={p?.wspolpraca_rolnicy ?? ""}
            placeholder="Ochrona upraw, szkody, kontakt w sezonie…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium">Kontakt dla mieszkańców (kiedy dzwonić)</span>
          <textarea
            name="mysliwi_kontakt_info"
            rows={2}
            defaultValue={p?.kontakt_dla_mieszkancow ?? ""}
            placeholder="Np. w razie znaleziska zwierzyny chorej — tel. łowczego…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium">Uwagi</span>
          <textarea
            name="mysliwi_uwagi"
            rows={2}
            defaultValue={p?.uwagi ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <input type="hidden" name="meeting_place" defaultValue={domyslne.meeting_place ?? ""} />
        <input type="hidden" name="schedule_text" defaultValue={domyslne.schedule_text ?? ""} />
      </div>
    </>
  );
}
