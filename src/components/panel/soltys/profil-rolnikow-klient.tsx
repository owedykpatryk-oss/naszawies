"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  aktualizujOrganizacjeWsi,
  dezaktywujOrganizacjeWsi,
  dodajOrganizacjeWsi,
} from "@/app/(site)/panel/soltys/akcje";
import {
  czyProfilRolnikowUzupelniony,
  parsujProfilRolnikow,
  profilRolnikowZFormularza,
  type OrganizacjaPelna,
} from "@/lib/wies/profil-organizacji";
import { sciezkaPelnejStronyOrganizacji } from "@/lib/wies/sciezka-organizacji-publicznej";

type WiesSciezkaPubliczna = {
  voivodeship: string;
  county: string;
  commune: string;
  slug: string;
};

export function ProfilRolnikowKlient({
  villageId,
  villageName,
  organizacje,
  sciezkaProfilu,
  wiesSciezka = null,
}: {
  villageId: string;
  villageName: string;
  organizacje: OrganizacjaPelna[];
  sciezkaProfilu?: string | null;
  wiesSciezka?: WiesSciezkaPubliczna | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [komunikat, setKomunikat] = useState<string | null>(null);
  const [blad, setBlad] = useState<string | null>(null);
  const [edytujId, ustawEdytujId] = useState<string | null>(null);

  const kola = useMemo(
    () => organizacje.filter((o) => o.group_type === "rolnicy" && o.village_id === villageId),
    [organizacje, villageId],
  );

  const edytowana = useMemo(
    () => (edytujId ? kola.find((p) => p.id === edytujId) ?? null : null),
    [edytujId, kola],
  );

  const profilEdycji = useMemo(() => parsujProfilRolnikow(edytowana?.profile_data) ?? null, [edytowana]);

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
          group_type: "rolnicy",
          name: String(fd.get("name") ?? ""),
          short_description: String(fd.get("short_description") ?? "") || null,
          contact_phone: String(fd.get("contact_phone") ?? "") || null,
          contact_email: String(fd.get("contact_email") ?? "") || null,
          meeting_place: String(fd.get("meeting_place") ?? "") || null,
          schedule_text: String(fd.get("schedule_text") ?? "") || null,
          profile_data: profilRolnikowZFormularza(fd),
        }),
      "Dodano profil koła rolników.",
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
          group_type: "rolnicy",
          name: String(fd.get("name") ?? ""),
          short_description: String(fd.get("short_description") ?? "") || null,
          contact_phone: String(fd.get("contact_phone") ?? "") || null,
          contact_email: String(fd.get("contact_email") ?? "") || null,
          meeting_place: String(fd.get("meeting_place") ?? "") || null,
          schedule_text: String(fd.get("schedule_text") ?? "") || null,
          profile_data: profilRolnikowZFormularza(fd),
        }),
      "Zaktualizowano profil koła.",
    );
  }

  function usun(id: string, nazwa: string) {
    if (!window.confirm(`Ukryć „${nazwa}" na stronie wsi?`)) return;
    run(() => dezaktywujOrganizacjeWsi(id, villageId), "Profil został ukryty.");
  }

  const sciezkaKola = useMemo((): ((kolo: OrganizacjaPelna) => string | null) => {
    if (!wiesSciezka?.slug) return () => null;
    return (kolo) =>
      sciezkaPelnejStronyOrganizacji(wiesSciezka, {
        id: kolo.id,
        name: kolo.name,
        group_type: "rolnicy",
      });
  }, [wiesSciezka]);

  const podgladKolaHref = kola.length > 0 ? sciezkaKola(kola[0]!) : null;
  const podgladRolnictwaHref = sciezkaProfilu ? `${sciezkaProfilu}/rolnictwo` : null;
  const polaProfilu = (p: ReturnType<typeof parsujProfilRolnikow>) => (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <input
        name="rolnicy_przewodniczacy"
        placeholder="Przewodniczący"
        defaultValue={p?.przewodniczacy ?? ""}
        className="rounded border border-stone-300 px-3 py-2 text-sm"
      />
      <input
        name="rolnicy_miejsce"
        placeholder="Miejsce spotkań"
        defaultValue={p?.miejsce_spotkan ?? ""}
        className="rounded border border-stone-300 px-3 py-2 text-sm"
      />
      <textarea
        name="rolnicy_zebrania"
        rows={2}
        placeholder="Terminy zebrań"
        defaultValue={p?.zebrania ?? ""}
        className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2"
      />
      <textarea
        name="rolnicy_dzialalnosc"
        rows={2}
        placeholder="Działalność koła"
        defaultValue={p?.dzialalnosc ?? ""}
        className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2"
      />
      <textarea
        name="rolnicy_arimr"
        rows={2}
        placeholder="Współpraca z ARiMR / dopłaty"
        defaultValue={p?.wspolpraca_arimr ?? ""}
        className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2"
      />
      <textarea
        name="rolnicy_jak_dolaczyc"
        rows={2}
        placeholder="Jak dołączyć"
        defaultValue={p?.jak_dolaczyc ?? ""}
        className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2"
      />
      <textarea
        name="rolnicy_uwagi"
        rows={2}
        placeholder="Uwagi"
        defaultValue={p?.uwagi ?? ""}
        className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2"
      />
    </div>
  );

  return (
    <section
      id="profil-rolnikow"
      className="scroll-mt-24 rounded-2xl border border-lime-300/70 bg-gradient-to-br from-lime-50/60 via-white to-green-50/30 p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-lime-950">Koło rolników — {villageName}</h2>
          <p className="mt-2 max-w-prose text-sm text-stone-600">
            Zebrania, przewodniczący i kontakt — publiczna strona pod{" "}
            <code className="rounded bg-lime-100 px-1">/rolnicy/nazwa</code>. Profil wsi (ARiMR, skup) uzupełniasz w{" "}
            <Link href="/panel/soltys/rolnictwo" className="font-medium text-green-800 underline">
              module Rolnictwo
            </Link>
            .
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {podgladKolaHref ? (
            <Link
              href={podgladKolaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-lime-300 bg-white px-3 py-2 text-sm font-medium text-lime-900 hover:bg-lime-50"
            >
              Podgląd koła ↗
            </Link>
          ) : null}
          {podgladRolnictwaHref ? (
            <Link
              href={podgladRolnictwaHref}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-lime-200 bg-lime-50/80 px-3 py-2 text-sm font-medium text-lime-900 hover:bg-lime-100"
            >
              Profil rolniczy wsi ↗
            </Link>
          ) : null}
        </div>
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

      {kola.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-lime-900">Aktywne profile</h3>
          <ul className="mt-2 space-y-2">
            {kola.map((s) => {
              const hrefKola = sciezkaKola(s);
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-lime-100 bg-white px-3 py-2 text-sm"
                >
                  <span>
                    <strong>{s.name}</strong>
                    {czyProfilRolnikowUzupelniony(parsujProfilRolnikow(s.profile_data)) ? (
                      <span className="ml-2 text-xs text-emerald-700">· profil uzupełniony</span>
                    ) : (
                      <span className="ml-2 text-xs text-amber-700">· uzupełnij szczegóły</span>
                    )}
                  </span>
                  <span className="flex flex-wrap gap-2">
                    {hrefKola ? (
                      <Link
                        href={hrefKola}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-lime-800 underline"
                      >
                        Podgląd
                      </Link>
                    ) : null}
                    <button type="button" className="text-xs font-medium text-lime-800 underline" onClick={() => ustawEdytujId(s.id)}>
                      Edytuj
                    </button>
                    <button type="button" className="text-xs text-red-700 underline" onClick={() => usun(s.id, s.name)}>
                      Ukryj
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <form onSubmit={edytowana ? onAktualizuj : onNowa} className="mt-6 rounded-xl border border-lime-100 bg-white/80 p-4">
        <h3 className="text-sm font-semibold text-lime-900">{edytowana ? `Edycja: ${edytowana.name}` : "Nowe koło rolników"}</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            name="name"
            placeholder="Nazwa (np. Koło Rolników w …)"
            required
            defaultValue={edytowana?.name ?? ""}
            className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2"
          />
          <textarea
            name="short_description"
            rows={2}
            placeholder="Krótki opis"
            defaultValue={edytowana?.short_description ?? ""}
            className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2"
          />
          <input
            name="meeting_place"
            placeholder="Miejsce spotkań"
            defaultValue={edytowana?.meeting_place ?? ""}
            className="rounded border border-stone-300 px-3 py-2 text-sm"
          />
          <input
            name="contact_phone"
            placeholder="Telefon"
            defaultValue={edytowana?.contact_phone ?? ""}
            className="rounded border border-stone-300 px-3 py-2 text-sm"
          />
          <input
            name="contact_email"
            placeholder="E-mail"
            type="email"
            defaultValue={edytowana?.contact_email ?? ""}
            className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2"
          />
          <textarea
            name="schedule_text"
            rows={2}
            placeholder="Harmonogram / zebrania"
            defaultValue={edytowana?.schedule_text ?? ""}
            className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2"
          />
        </div>
        {polaProfilu(profilEdycji)}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" disabled={pending} className="btn-panel-primary text-sm">
            {edytowana ? "Zapisz zmiany" : "Dodaj koło"}
          </button>
          {edytowana ? (
            <button type="button" className="btn-panel-secondary text-sm" onClick={() => ustawEdytujId(null)}>
              Anuluj edycję
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
