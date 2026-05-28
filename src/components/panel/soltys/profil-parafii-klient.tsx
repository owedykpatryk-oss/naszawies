"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  aktualizujOrganizacjeWsi,
  dezaktywujOrganizacjeWsi,
  dodajOrganizacjeWsi,
} from "@/app/(site)/panel/soltys/akcje";
import { etykietaTypuGrupy } from "@/lib/wies/teksty-organizacji";
import { parsujProfilParafii, profilParafiiZFormularza, type OrganizacjaPelna, type ProfilParafiiJson } from "@/lib/wies/profil-organizacji";

export type { OrganizacjaPelna };

export function ProfilParafiiKlient({
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

  return (
    <section
      id="profil-parafii"
      className="scroll-mt-24 rounded-2xl border border-violet-300/70 bg-gradient-to-br from-violet-50/60 via-white to-indigo-50/30 p-5 shadow-sm"
    >
      <h2 className="font-serif text-xl text-violet-950">Profil parafii — {villageName}</h2>
      <p className="mt-2 max-w-prose text-sm text-stone-600">
        Msze, spowiedź, kancelaria i kontakt — mieszkańcy zobaczą wyróżnioną sekcję na profilu wsi (kotwica{" "}
        <code className="rounded bg-violet-100 px-1">#parafia</code>).
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

      {parafie.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-violet-900">Aktywne profile parafii</h3>
          <ul className="mt-2 space-y-2">
            {parafie.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-stone-900">{p.name}</p>
                  <p className="text-xs text-stone-500">{etykietaTypuGrupy(p.group_type)}</p>
                </div>
                <div className="flex gap-2">
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
            ))}
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

function PolaParafii({
  domyslne,
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
}) {
  const p = domyslne.profil;
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
        <input type="hidden" name="meeting_place" defaultValue={domyslne.meeting_place ?? ""} />
      </div>

      <fieldset className="rounded-xl border border-violet-100 bg-violet-50/40 p-4">
        <legend className="px-1 text-xs font-bold uppercase tracking-wider text-violet-800">Liturgia i kancelaria</legend>
        <div className="mt-3 grid gap-3">
          <label className="block text-sm">
            <span className="font-medium">Msze św. — niedziele i święta</span>
            <textarea
              name="parafia_msze_niedziele"
              rows={3}
              defaultValue={p?.msze_niedziele ?? ""}
              placeholder="np. Nd I: 8:00, 10:00, 12:00 · Nd II: 10:00, 12:00"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Msze św. — dni powszednie</span>
            <textarea
              name="parafia_msze_dni_powszednie"
              rows={2}
              defaultValue={p?.msze_dni_powszednie ?? ""}
              placeholder="np. pon.–pt. 18:00"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
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
