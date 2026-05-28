"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  aktualizujOrganizacjeWsi,
  dezaktywujOrganizacjeWsi,
  dodajOrganizacjeWsi,
} from "@/app/(site)/panel/soltys/akcje";
import { etykietaTypuGrupy } from "@/lib/wies/teksty-organizacji";
import {
  parsujProfilKgw,
  profilKgwZFormularza,
  type OrganizacjaPelna,
  type ProfilKgwJson,
} from "@/lib/wies/profil-organizacji";

export type { OrganizacjaPelna };

export function ProfilKgwKlient({
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
    () => organizacje.filter((o) => o.group_type === "kgw" && o.village_id === villageId),
    [organizacje, villageId],
  );

  const edytowana = useMemo(
    () => (edytujId ? kola.find((p) => p.id === edytujId) ?? null : null),
    [edytujId, kola],
  );

  const profilEdycji = useMemo(() => parsujProfilKgw(edytowana?.profile_data) ?? null, [edytowana]);

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
          group_type: "kgw",
          name: String(fd.get("name") ?? ""),
          short_description: String(fd.get("short_description") ?? "") || null,
          contact_phone: String(fd.get("contact_phone") ?? "") || null,
          contact_email: String(fd.get("contact_email") ?? "") || null,
          meeting_place: String(fd.get("meeting_place") ?? "") || null,
          schedule_text: String(fd.get("schedule_text") ?? "") || null,
          profile_data: profilKgwZFormularza(fd),
        }),
      "Dodano profil KGW.",
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
          group_type: "kgw",
          name: String(fd.get("name") ?? ""),
          short_description: String(fd.get("short_description") ?? "") || null,
          contact_phone: String(fd.get("contact_phone") ?? "") || null,
          contact_email: String(fd.get("contact_email") ?? "") || null,
          meeting_place: String(fd.get("meeting_place") ?? "") || null,
          schedule_text: String(fd.get("schedule_text") ?? "") || null,
          profile_data: profilKgwZFormularza(fd),
        }),
      "Zaktualizowano profil KGW.",
    );
  }

  function usun(id: string, nazwa: string) {
    if (!window.confirm(`Ukryć profil „${nazwa}" na stronie wsi? (można dodać ponownie).`)) return;
    run(() => dezaktywujOrganizacjeWsi(id, villageId), "Profil KGW został ukryty.");
  }

  return (
    <section
      id="profil-kgw"
      className="scroll-mt-24 rounded-2xl border border-rose-300/70 bg-gradient-to-br from-rose-50/60 via-white to-fuchsia-50/30 p-5 shadow-sm"
    >
      <h2 className="font-serif text-xl text-rose-950">Profil KGW — {villageName}</h2>
      <p className="mt-2 max-w-prose text-sm text-stone-600">
        Zebrania, przewodnicząca, produkty lokalne i jak dołączyć — mieszkańcy zobaczą wyróżnioną sekcję na profilu wsi
        (kotwica <code className="rounded bg-rose-100 px-1">#kgw</code>).
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
          <h3 className="text-sm font-semibold text-rose-900">Aktywne profile KGW</h3>
          <ul className="mt-2 space-y-2">
            {kola.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-white px-4 py-3"
              >
                <div>
                  <p className="font-medium text-stone-900">{p.name}</p>
                  <p className="text-xs text-stone-500">{etykietaTypuGrupy(p.group_type)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => ustawEdytujId(p.id)}
                    className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-900 hover:bg-rose-50"
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
        className="mt-6 space-y-4 rounded-xl border border-rose-200/80 bg-white/90 p-4"
      >
        <h3 className="text-sm font-semibold text-rose-950">
          {edytowana ? `Edycja: ${edytowana.name}` : kola.length ? "Dodaj kolejne KGW" : "Nowy profil KGW"}
        </h3>

        <PolaKgw
          key={edytowana?.id ?? "nowa"}
          domyslne={{
            name: edytowana?.name ?? `KGW ${villageName}`,
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
            className="rounded-lg bg-rose-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-900 disabled:opacity-60"
          >
            {pending ? "Zapisuję…" : edytowana ? "Zapisz zmiany" : "Dodaj profil KGW"}
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

function PolaKgw({
  domyslne,
}: {
  domyslne: {
    name: string;
    short_description: string | null;
    contact_phone: string | null;
    contact_email: string | null;
    meeting_place: string | null;
    schedule_text: string | null;
    profil: ProfilKgwJson | null;
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
            placeholder="np. KGW w …"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Przewodnicząca</span>
          <input
            name="kgw_przewodniczaca"
            defaultValue={p?.przewodniczaca ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Zastępczyni (opcjonalnie)</span>
          <input
            name="kgw_zastepczyni"
            defaultValue={p?.zastepczyni ?? ""}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Rok założenia</span>
          <input
            name="kgw_rok_zalozenia"
            defaultValue={p?.rok_zalozenia ?? ""}
            placeholder="np. 1998"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-stone-800">Miejsce spotkań</span>
          <input
            name="kgw_miejsce_spotkan"
            defaultValue={p?.miejsce_spotkan ?? domyslne.meeting_place ?? ""}
            placeholder="świetlica, dom kultury…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Strona www</span>
          <input
            name="kgw_strona_www"
            type="url"
            defaultValue={p?.strona_www ?? ""}
            placeholder="https://…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-stone-800">Facebook</span>
          <input
            name="kgw_facebook"
            defaultValue={p?.facebook ?? ""}
            placeholder="https://facebook.com/…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <fieldset className="rounded-xl border border-rose-100 bg-rose-50/40 p-4">
        <legend className="px-1 text-xs font-bold uppercase tracking-wider text-rose-800">Zebrania i działalność</legend>
        <div className="mt-3 grid gap-3">
          <label className="block text-sm">
            <span className="font-medium">Zebrania — terminy</span>
            <textarea
              name="kgw_zebrania"
              rows={3}
              defaultValue={p?.zebrania ?? domyslne.schedule_text ?? ""}
              placeholder="np. co drugi wtorek miesiąca, godz. 17:00"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Opis działalności koła</span>
            <textarea
              name="kgw_dzialalnosc"
              rows={3}
              defaultValue={p?.dzialalnosc ?? ""}
              placeholder="Imprezy wiejskie, współpraca ze szkołą, tradycje kulinarne…"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Produkty i wyroby (opcjonalnie)</span>
            <textarea
              name="kgw_produkty_lokalne"
              rows={2}
              defaultValue={p?.produkty_lokalne ?? ""}
              placeholder="Pierogi, przetwory, wyroby rękodzielnicze…"
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
          <span className="font-medium">Jak dołączyć do koła</span>
          <textarea
            name="kgw_jak_dolaczyc"
            rows={2}
            defaultValue={p?.jak_dolaczyc ?? ""}
            placeholder="Zgłoś się na zebraniu lub zadzwoń do przewodniczącej…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium">Dotacje i projekty (skrót)</span>
          <textarea
            name="kgw_wspolpraca_dotacje"
            rows={2}
            defaultValue={p?.wspolpraca_dotacje ?? ""}
            placeholder="Fundusz sołecki, PROW, współpraca z gminą…"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium">Uwagi (np. zbiórka na imprezę)</span>
          <textarea
            name="kgw_uwagi"
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
