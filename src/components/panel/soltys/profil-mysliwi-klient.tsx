"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  aktualizujOrganizacjeWsi,
  dezaktywujOrganizacjeWsi,
  dodajOrganizacjeWsi,
} from "@/app/(site)/panel/soltys/akcje";
import { etykietaTypuGrupy } from "@/lib/wies/teksty-organizacji";
import {
  parsujProfilLowiecki,
  profilLowieckiZFormularza,
  type OrganizacjaPelna,
  type ProfilLowieckiJson,
} from "@/lib/wies/profil-organizacji";

export function ProfilMysliwiKlient({
  villageId,
  villageName,
  organizacje,
}: {
  villageId: string;
  villageName: string;
  organizacje: OrganizacjaPelna[];
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
      <h2 className="font-serif text-xl text-emerald-950">Profil myśliwych — {villageName}</h2>
      <p className="mt-2 max-w-prose text-sm text-stone-600">
        Obwód, kontakt, zasady bezpieczeństwa — mieszkańcy zobaczą sekcję{" "}
        <code className="rounded bg-emerald-100 px-1">#mysliwi</code> oraz powiązane ostrzeżenia polowań.
      </p>
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

      {kola.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-emerald-900">Aktywne profile</h3>
          <ul className="mt-2 space-y-2">
            {kola.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-stone-900">{p.name}</p>
                  <p className="text-xs text-stone-500">{etykietaTypuGrupy(p.group_type)}</p>
                </div>
                <div className="flex gap-2">
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
            ))}
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
      </div>

      <fieldset className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4">
        <legend className="px-1 text-xs font-bold uppercase tracking-wider text-amber-900">
          Sezon, zebrania i bezpieczeństwo
        </legend>
        <div className="mt-3 grid gap-3">
          <label className="block text-sm">
            <span className="font-medium">Zebrania koła</span>
            <textarea
              name="mysliwi_zebrania"
              rows={2}
              defaultValue={p?.zebrania ?? domyslne.schedule_text ?? ""}
              placeholder="np. pierwsza środa miesiąca, godz. 18:00"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Sezon łowiecki</span>
            <textarea
              name="mysliwi_sezon"
              rows={2}
              defaultValue={p?.sezon_lowiecki ?? ""}
              placeholder="Daty sezonu, okresy ochronne…"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Zasady bezpieczeństwa dla mieszkańców</span>
            <textarea
              name="mysliwi_bezpieczenstwo"
              rows={3}
              defaultValue={p?.zasady_bezpieczenstwa ?? ""}
              placeholder="Znaki, odległość od domów, psy na smyczy, godziny polowań…"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
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
