"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dodajOspZOsm } from "@/app/(site)/panel/soltys/akcje-mapa-poi";
import {
  aktualizujOrganizacjeWsi,
  dezaktywujOrganizacjeWsi,
  dodajOrganizacjeWsi,
} from "@/app/(site)/panel/soltys/akcje";
import { etykietaTypuGrupy } from "@/lib/wies/teksty-organizacji";
import {
  czyOrganizacjaOsp,
  czyProfilOspUzupelniony,
  parsujProfilOsp,
  profilOspZFormularza,
  type OrganizacjaPelna,
  type ProfilOspJson,
} from "@/lib/wies/profil-organizacji";

const SZABLONY_CWICZEN = [
  { etykieta: "Co tydzień", tekst: "Ćwiczenia: każda sobota, godz. 10:00 — remiza OSP." },
  { etykieta: "Co 2 tygodnie", tekst: "Ćwiczenia co drugą niedzielę miesiąca, godz. 9:00." },
  { etykieta: "Sezon letni", tekst: "Od kwietnia do października — ćwiczenia w każdą pierwszą sobotę miesiąca." },
] as const;

function komunikatOsm(wynik: { ok?: true; dodano?: number; pominietoDuplikaty?: number; blad?: string }) {
  if ("blad" in wynik && wynik.blad) return wynik.blad;
  const czesci: string[] = [];
  if (wynik.dodano) czesci.push(`Dodano ${wynik.dodano} remizę/straż z OSM.`);
  else czesci.push("Nie znaleziono nowej remizy w OSM (albo jest już na mapie).");
  if (wynik.pominietoDuplikaty) czesci.push(`Pominięto duplikaty: ${wynik.pominietoDuplikaty}.`);
  return czesci.join(" ");
}

export function ProfilOspKlient({
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
  const [czekOsm, ustawCzekOsm] = useState(false);

  const jednostki = useMemo(
    () =>
      organizacje.filter(
        (o) => o.village_id === villageId && czyOrganizacjaOsp(o.group_type, o.name),
      ),
    [organizacje, villageId],
  );

  const edytowana = useMemo(
    () => (edytujId ? jednostki.find((p) => p.id === edytujId) ?? null : null),
    [edytujId, jednostki],
  );

  const profilEdycji = useMemo(() => parsujProfilOsp(edytowana?.profile_data) ?? null, [edytowana]);

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
          group_type: "osp",
          name: String(fd.get("name") ?? ""),
          short_description: String(fd.get("short_description") ?? "") || null,
          contact_phone: String(fd.get("contact_phone") ?? "") || null,
          contact_email: String(fd.get("contact_email") ?? "") || null,
          meeting_place: String(fd.get("meeting_place") ?? "") || null,
          schedule_text: String(fd.get("schedule_text") ?? "") || null,
          profile_data: profilOspZFormularza(fd),
        }),
      "Dodano profil OSP.",
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
          group_type: "osp",
          name: String(fd.get("name") ?? ""),
          short_description: String(fd.get("short_description") ?? "") || null,
          contact_phone: String(fd.get("contact_phone") ?? "") || null,
          contact_email: String(fd.get("contact_email") ?? "") || null,
          meeting_place: String(fd.get("meeting_place") ?? "") || null,
          schedule_text: String(fd.get("schedule_text") ?? "") || null,
          profile_data: profilOspZFormularza(fd),
        }),
      "Zaktualizowano profil OSP.",
    );
  }

  function usun(id: string, nazwa: string) {
    if (!window.confirm(`Ukryć profil „${nazwa}" na stronie wsi? (można dodać ponownie).`)) return;
    run(() => dezaktywujOrganizacjeWsi(id, villageId), "Profil OSP został ukryty.");
  }

  function importOspZOsm() {
    setBlad(null);
    setKomunikat(null);
    ustawCzekOsm(true);
    startTransition(async () => {
      const w = await dodajOspZOsm({ villageId });
      ustawCzekOsm(false);
      if ("blad" in w && w.blad) {
        setBlad(w.blad);
        return;
      }
      setKomunikat(komunikatOsm(w));
      router.refresh();
    });
  }

  const podgladHref = sciezkaProfilu ? `${sciezkaProfilu}#osp` : null;

  return (
    <section
      id="profil-osp"
      className="scroll-mt-24 rounded-2xl border border-red-300/70 bg-gradient-to-br from-red-50/60 via-white to-orange-50/30 p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-red-950">Profil OSP — {villageName}</h2>
          <p className="mt-2 max-w-prose text-sm text-stone-600">
            Ćwiczenia, dyżury, rekrutacja i bezpieczeństwo — mieszkańcy zobaczą wyróżnioną sekcję na profilu wsi
            (kotwica <code className="rounded bg-red-100 px-1">#osp</code>).
          </p>
        </div>
        {podgladHref ? (
          <Link
            href={podgladHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-900 hover:bg-red-50"
          >
            Podgląd publiczny ↗
          </Link>
        ) : null}
      </div>

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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-red-100 bg-red-50/50 p-3">
          <p className="text-xs font-semibold text-red-900">Remiza na mapie</p>
          <p className="mt-1 text-xs text-stone-600">Import z OpenStreetMap — pinezka pojawi się na karcie OSP.</p>
          <button
            type="button"
            onClick={importOspZOsm}
            disabled={pending || czekOsm || !villageId}
            className="mt-2 rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-50 disabled:opacity-60"
          >
            {czekOsm ? "Szukam w OSM…" : "Szybko: remiza z OpenStreetMap"}
          </button>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50/50 p-3">
          <p className="text-xs font-semibold text-red-900">Punkty czerpania wody</p>
          <p className="mt-1 text-xs text-stone-600">Hydranty i zbiorniki dodajesz w module Moja wieś → mapa OSP.</p>
          <Link
            href="/panel/soltys/moja-wies"
            className="mt-2 inline-flex rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-50"
          >
            Moja wieś → mapa
          </Link>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 text-xs text-stone-700">
        <p className="font-semibold text-amber-950">Wskazówka</p>
        <p className="mt-1">
          Dodaj ćwiczenia jako wydarzenie typu <strong>Próba / zajęcia</strong> w zakładce Wydarzenia. Komunikat
          bezpieczeństwa (np. zakaz palenia traw) — w zakładce Wiadomości lokalne.
        </p>
      </div>

      {jednostki.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-red-900">Aktywne profile OSP</h3>
          <ul className="mt-2 space-y-2">
            {jednostki.map((p) => {
              const profil = parsujProfilOsp(p.profile_data);
              const uzupelniony = czyProfilOspUzupelniony(profil);
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-white px-4 py-3"
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
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-900 hover:bg-red-50"
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
        className="mt-6 space-y-4 rounded-xl border border-red-200/80 bg-white/90 p-4"
      >
        <h3 className="text-sm font-semibold text-red-950">
          {edytowana ? `Edycja: ${edytowana.name}` : jednostki.length ? "Dodaj kolejną jednostkę" : "Nowy profil OSP"}
        </h3>

        <PolaOsp
          key={edytowana?.id ?? "nowa"}
          domyslne={{
            name: edytowana?.name ?? `OSP ${villageName}`,
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
            className="rounded-lg bg-red-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-900 disabled:opacity-60"
          >
            {pending ? "Zapisuję…" : edytowana ? "Zapisz zmiany" : "Dodaj profil OSP"}
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
          className="rounded-md border border-red-200 bg-red-50/80 px-2 py-0.5 text-[11px] font-medium text-red-900 hover:bg-red-100"
        >
          {s.etykieta}
        </button>
      ))}
    </div>
  );
}

function PolaOsp({
  domyslne,
}: {
  domyslne: {
    name: string;
    short_description: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    meeting_place: string | null;
    schedule_text: string | null;
    profil: ProfilOspJson | null;
  };
}) {
  const p = domyslne.profil;
  const refCwiczenia = useRef<HTMLTextAreaElement>(null);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-stone-800">Nazwa jednostki</span>
          <input
            name="name"
            required
            defaultValue={domyslne.name}
            placeholder="np. OSP w …"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Naczelnik</span>
          <input
            name="osp_naczelnik"
            defaultValue={p?.naczelnik ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Zastępca naczelnika</span>
          <input
            name="osp_zastepca"
            defaultValue={p?.zastepca_naczelnika ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Nr jednostki (opcjonalnie)</span>
          <input
            name="osp_numer_jednostki"
            defaultValue={p?.numer_jednostki ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-stone-800">Adres remizy</span>
          <input
            name="osp_siedziba"
            defaultValue={p?.siedziba_remizy ?? domyslne.meeting_place ?? ""}
            placeholder="ul. …"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Strona www</span>
          <input
            name="osp_strona_www"
            type="url"
            defaultValue={p?.strona_www ?? ""}
            placeholder="https://…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Facebook</span>
          <input
            name="osp_facebook"
            defaultValue={p?.facebook ?? ""}
            placeholder="https://facebook.com/…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-stone-800">Instagram</span>
          <input
            name="osp_instagram"
            defaultValue={p?.instagram ?? ""}
            placeholder="https://instagram.com/…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <input type="hidden" name="meeting_place" defaultValue={domyslne.meeting_place ?? ""} />
      </div>

      <fieldset className="rounded-xl border border-red-100 bg-red-50/40 p-4">
        <legend className="px-1 text-xs font-bold uppercase tracking-wider text-red-800">Ćwiczenia i dyżury</legend>
        <div className="mt-3 grid gap-3">
          <label className="block text-sm">
            <span className="font-medium">Ćwiczenia — terminy</span>
            <textarea
              ref={refCwiczenia}
              name="osp_cwiczenia"
              rows={3}
              defaultValue={p?.cwiczenia ?? domyslne.schedule_text ?? ""}
              placeholder="np. sobota 10:00, remiza"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
            <SzablonyPola
              szablony={SZABLONY_CWICZEN}
              onWstaw={(tekst) => {
                if (refCwiczenia.current) refCwiczenia.current.value = tekst;
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Dyżury</span>
            <textarea
              name="osp_dyzury"
              rows={2}
              defaultValue={p?.dyzury ?? ""}
              placeholder="np. weekendy rotacyjnie — szczegóły u naczelnika"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      </fieldset>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium">Telefon (nie alarmowy)</span>
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
          <span className="font-medium">Rekrutacja — jak dołączyć</span>
          <textarea
            name="osp_rekrutacja"
            rows={2}
            defaultValue={p?.rekrutacja ?? ""}
            placeholder="Wymagania wiekowe, kontakt, terminy naboru…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium">Bezpieczeństwo pożarowe dla mieszkańców</span>
          <textarea
            name="osp_bezpieczenstwo"
            rows={3}
            defaultValue={p?.zasady_bezpieczenstwa ?? ""}
            placeholder="Kominy, palenie traw, grillowanie, numer alarmowy 112…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium">Punkty czerpania wody (opis)</span>
          <textarea
            name="osp_punkty_wody"
            rows={2}
            defaultValue={p?.punkty_wody ?? ""}
            placeholder="Lokalizacja hydrantów, dostęp zimą — szczegóły też na mapie wsi"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium">Wsparcie finansowe (1,5%, darowizny)</span>
          <textarea
            name="osp_wsparcie"
            rows={2}
            defaultValue={p?.wsparcie_finansowe ?? ""}
            placeholder="Numer konta, odpis podatkowy, zbiórki…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium">Uwagi (np. remont remizy)</span>
          <textarea
            name="osp_uwagi"
            rows={2}
            defaultValue={p?.uwagi ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <input type="hidden" name="schedule_text" defaultValue={domyslne.schedule_text ?? ""} />
      </div>
    </>
  );
}
