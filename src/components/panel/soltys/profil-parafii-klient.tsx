"use client";

import Link from "next/link";
import { FormEvent, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { dodajKosciolZOsm } from "@/app/(site)/panel/soltys/akcje-mapa-poi";
import {
  aktualizujOrganizacjeWsi,
  dezaktywujOrganizacjeWsi,
  dodajOrganizacjeWsi,
} from "@/app/(site)/panel/soltys/akcje";
import { etykietaTypuGrupy } from "@/lib/wies/teksty-organizacji";
import {
  czyProfilParafiiUzupelniony,
  parsujProfilParafii,
  profilParafiiZFormularza,
  type OrganizacjaPelna,
  type ProfilParafiiJson,
} from "@/lib/wies/profil-organizacji";
import { IntencjeTygodnioweParafiaKlient } from "@/components/panel/soltys/intencje-tygodniowe-parafia-klient";
import { PolaOkladkiOrganizacji } from "@/components/panel/soltys/pola-okladki-organizacji";

export type { OrganizacjaPelna };

const SZABLONY_MSZY_NIEDZIELE = [
  {
    etykieta: "Typowa wieś (2 msze)",
    tekst: "Nd I: 8:00, 10:00\nNd II: 10:00, 12:00\nŚwięta: jak w niedzielę I",
  },
  {
    etykieta: "Jedna msza nd.",
    tekst: "Niedziele i święta: 10:00",
  },
  {
    etykieta: "3 msze nd.",
    tekst: "Nd I: 7:00, 9:00, 11:00\nNd II: 9:00, 11:00, 18:00",
  },
] as const;

const SZABLONY_MSZE_DNI = [
  { etykieta: "Wieczorne", tekst: "Pon.–pt.: 18:00" },
  { etykieta: "Poranne", tekst: "Pon., śr., pt.: 7:00" },
  { etykieta: "Brak w tygodniu", tekst: "W dni powszednie mszy nie ma — tylko niedziele i święta." },
] as const;

function komunikatOsm(wynik: { ok?: true; dodano?: number; pominietoDuplikaty?: number; blad?: string }) {
  if ("blad" in wynik && wynik.blad) return wynik.blad;
  const czesci: string[] = [];
  if (wynik.dodano) czesci.push(`Dodano ${wynik.dodano} kościół/obiekt kultu z OSM.`);
  else czesci.push("Nie znaleziono nowego kościoła w OSM (albo jest już na mapie).");
  if (wynik.pominietoDuplikaty) czesci.push(`Pominięto duplikaty: ${wynik.pominietoDuplikaty}.`);
  return czesci.join(" ");
}

export function ProfilParafiiKlient({
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

  const parafie = useMemo(
    () => organizacje.filter((o) => o.group_type === "parafia" && o.village_id === villageId),
    [organizacje, villageId],
  );

  const edytowana = useMemo(
    () => (edytujId ? parafie.find((p) => p.id === edytujId) ?? null : null),
    [edytujId, parafie],
  );

  const profilEdycji = useMemo(() => parsujProfilParafii(edytowana?.profile_data) ?? null, [edytowana]);

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
          group_type: "parafia",
          name: String(fd.get("name") ?? ""),
          short_description: String(fd.get("short_description") ?? "") || null,
          contact_phone: String(fd.get("contact_phone") ?? "") || null,
          contact_email: String(fd.get("contact_email") ?? "") || null,
          meeting_place: String(fd.get("meeting_place") ?? "") || null,
          schedule_text: String(fd.get("schedule_text") ?? "") || null,
          profile_data: profilParafiiZFormularza(fd),
        }),
      "Dodano profil parafii.",
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
          group_type: "parafia",
          name: String(fd.get("name") ?? ""),
          short_description: String(fd.get("short_description") ?? "") || null,
          contact_phone: String(fd.get("contact_phone") ?? "") || null,
          contact_email: String(fd.get("contact_email") ?? "") || null,
          meeting_place: String(fd.get("meeting_place") ?? "") || null,
          schedule_text: String(fd.get("schedule_text") ?? "") || null,
          profile_data: profilParafiiZFormularza(fd),
        }),
      "Zaktualizowano profil parafii.",
    );
  }

  function usun(id: string, nazwa: string) {
    if (!window.confirm(`Ukryć profil „${nazwa}" na stronie wsi? (można dodać ponownie).`)) return;
    run(() => dezaktywujOrganizacjeWsi(id, villageId), "Profil parafii został ukryty.");
  }

  function importKosciolZOsm() {
    setBlad(null);
    setKomunikat(null);
    ustawCzekOsm(true);
    startTransition(async () => {
      const w = await dodajKosciolZOsm({ villageId });
      ustawCzekOsm(false);
      if ("blad" in w && w.blad) {
        setBlad(w.blad);
        return;
      }
      setKomunikat(komunikatOsm(w));
      router.refresh();
    });
  }

  const podgladHref = sciezkaProfilu ? `${sciezkaProfilu}#parafia` : null;

  return (
    <section
      id="profil-parafii"
      className="scroll-mt-24 rounded-2xl border border-violet-300/70 bg-gradient-to-br from-violet-50/60 via-white to-indigo-50/30 p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-violet-950">Profil parafii — {villageName}</h2>
          <p className="mt-2 max-w-prose text-sm text-stone-600">
            Msze, spowiedź, kancelaria i kontakt — mieszkańcy zobaczą wyróżnioną sekcję na profilu wsi (kotwica{" "}
            <code className="rounded bg-violet-100 px-1">#parafia</code>).
          </p>
        </div>
        {podgladHref ? (
          <Link
            href={podgladHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm font-medium text-violet-900 hover:bg-violet-50"
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

      <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/50 p-3">
        <p className="text-xs font-semibold text-violet-900">Kościół na mapie wsi</p>
        <p className="mt-1 text-xs text-stone-600">
          Import z OpenStreetMap dodaje pinezkę kościoła — link pojawi się na publicznej karcie parafii.
        </p>
        <button
          type="button"
          onClick={importKosciolZOsm}
          disabled={pending || czekOsm || !villageId}
          className="mt-2 rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-xs font-medium text-violet-900 hover:bg-violet-50 disabled:opacity-60"
        >
          {czekOsm ? "Szukam w OSM…" : "Szybko: kościół z OpenStreetMap"}
        </button>
      </div>

      {parafie.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-violet-900">Aktywne profile parafii</h3>
          <ul className="mt-2 space-y-2">
            {parafie.map((p) => {
              const profil = parsujProfilParafii(p.profile_data);
              const uzupelniony = czyProfilParafiiUzupelniony(profil);
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-200 bg-white px-4 py-3"
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
                      className="rounded-lg border border-violet-300 px-3 py-1.5 text-xs font-medium text-violet-900 hover:bg-violet-50"
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
        className="mt-6 space-y-4 rounded-xl border border-violet-200/80 bg-white/90 p-4"
      >
        <h3 className="text-sm font-semibold text-violet-950">
          {edytowana ? `Edycja: ${edytowana.name}` : parafie.length ? "Dodaj kolejną parafię" : "Nowy profil parafii"}
        </h3>

        <PolaParafii
          key={edytowana?.id ?? "nowa"}
          villageId={villageId}
          domyslne={{
            name: edytowana?.name ?? `Parafia ${villageName}`,
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
            className="rounded-lg bg-violet-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-900 disabled:opacity-60"
          >
            {pending ? "Zapisuję…" : edytowana ? "Zapisz zmiany" : "Dodaj profil parafii"}
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
          className="rounded-md border border-violet-200 bg-violet-50/80 px-2 py-0.5 text-[11px] font-medium text-violet-900 hover:bg-violet-100"
        >
          {s.etykieta}
        </button>
      ))}
    </div>
  );
}

function PolaParafii({
  domyslne,
  villageId,
}: {
  domyslne: {
    name: string;
    short_description: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    meeting_place: string | null;
    schedule_text: string | null;
    profil: ProfilParafiiJson | null;
  };
  villageId: string;
}) {
  const p = domyslne.profil;
  const refMszeNd = useRef<HTMLTextAreaElement>(null);
  const refMszeDni = useRef<HTMLTextAreaElement>(null);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-stone-800">Nazwa parafii</span>
          <input
            name="name"
            required
            defaultValue={domyslne.name}
            placeholder="np. Parafia pw. św. … w …"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <PolaOkladkiOrganizacji prefix="parafia" villageId={villageId} okladkaUrl={p?.okladka_url} haslo={p?.haslo} />
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Proboszcz</span>
          <input
            name="parafia_proboszcz"
            defaultValue={p?.proboszcz ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Wikary (opcjonalnie)</span>
          <input
            name="parafia_wikary"
            defaultValue={p?.wikary ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-stone-800">Adres kościoła</span>
          <input
            name="parafia_adres_kosciola"
            defaultValue={p?.adres_kosciola ?? domyslne.meeting_place ?? ""}
            placeholder="ul. …"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-stone-800">Strona internetowa parafii</span>
          <input
            name="parafia_strona_www"
            type="url"
            defaultValue={p?.strona_www ?? ""}
            placeholder="https://…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-stone-800">Facebook parafii</span>
          <input
            name="parafia_facebook"
            defaultValue={p?.facebook ?? ""}
            placeholder="https://facebook.com/…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <input type="hidden" name="meeting_place" defaultValue={domyslne.meeting_place ?? ""} />
      </div>

      <fieldset className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
        <legend className="px-1 text-xs font-bold uppercase tracking-wider text-violet-800">Liturgia i kancelaria</legend>
        <div className="mt-3 grid gap-3">
          <label className="block text-sm">
            <span className="font-medium">Msze św. — niedziele i święta</span>
            <textarea
              ref={refMszeNd}
              name="parafia_msze_niedziele"
              rows={3}
              defaultValue={p?.msze_niedziele ?? ""}
              placeholder="np. Nd I: 8:00, 10:00, 12:00 · Nd II: 10:00, 12:00"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
            <SzablonyPola
              szablony={SZABLONY_MSZY_NIEDZIELE}
              onWstaw={(tekst) => {
                if (refMszeNd.current) refMszeNd.current.value = tekst;
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Msze św. — dni powszednie</span>
            <textarea
              ref={refMszeDni}
              name="parafia_msze_dni_powszednie"
              rows={2}
              defaultValue={p?.msze_dni_powszednie ?? ""}
              placeholder="np. pon.–pt. 18:00"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
            <SzablonyPola
              szablony={SZABLONY_MSZE_DNI}
              onWstaw={(tekst) => {
                if (refMszeDni.current) refMszeDni.current.value = tekst;
              }}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Spowiedź św.</span>
            <textarea
              name="parafia_spowiedz"
              rows={2}
              defaultValue={p?.spowiedz ?? ""}
              placeholder="np. sob. 16:00–17:00, nd. 30 min przed każdą mszą"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Kancelaria parafialna</span>
            <textarea
              name="parafia_kancelaria"
              rows={2}
              defaultValue={p?.kancelaria ?? domyslne.schedule_text ?? ""}
              placeholder="np. wt. i czw. 16:00–17:30"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Intencje mszalne — ogólne informacje</span>
            <textarea
              name="parafia_intencje"
              rows={2}
              defaultValue={p?.intencje_mszalne ?? ""}
              placeholder="Jak zgłaszać intencje (telefon, kancelaria, wpłata)…"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <div className="block text-sm">
            <span className="font-medium">Intencje mszalne — tabela tygodnia</span>
            <IntencjeTygodnioweParafiaKlient poczatkowe={p?.intencje_tygodniowe ?? null} />
          </div>
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
          <span className="font-medium">Chrzty, śluby, pogrzeby — informacje</span>
          <textarea
            name="parafia_sakramenty"
            rows={3}
            defaultValue={p?.sakramenty ?? ""}
            placeholder="Umówienie w kancelarii, wymagane dokumenty…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium">Grupy duszpasterskie</span>
          <textarea
            name="parafia_grupy"
            rows={2}
            defaultValue={p?.grupy_duszpasterskie ?? ""}
            placeholder="Schola, rada parafialna, ministranci…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium">Cmentarz parafialny — informacje</span>
          <textarea
            name="parafia_info_cmentarz"
            rows={2}
            defaultValue={p?.info_cmentarz ?? ""}
            placeholder="Lokalizacja, godziny otwarcia bramy, kontakt do opieki nad grobami…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium">Uwagi (np. remont kościoła)</span>
          <textarea
            name="parafia_uwagi"
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
