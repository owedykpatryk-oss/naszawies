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
  czyProfilSzkolyUzupelniony,
  parsujProfilSzkoly,
  profilSzkolyZFormularza,
  type OrganizacjaPelna,
} from "@/lib/wies/profil-organizacji";

export function ProfilSzkolyKlient({
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

  const szkoly = useMemo(
    () => organizacje.filter((o) => o.group_type === "szkola" && o.village_id === villageId),
    [organizacje, villageId],
  );

  const edytowana = useMemo(
    () => (edytujId ? szkoly.find((p) => p.id === edytujId) ?? null : null),
    [edytujId, szkoly],
  );

  const profilEdycji = useMemo(() => parsujProfilSzkoly(edytowana?.profile_data) ?? null, [edytowana]);

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
          group_type: "szkola",
          name: String(fd.get("name") ?? ""),
          short_description: String(fd.get("short_description") ?? "") || null,
          contact_phone: String(fd.get("contact_phone") ?? "") || null,
          contact_email: String(fd.get("contact_email") ?? "") || null,
          meeting_place: String(fd.get("meeting_place") ?? "") || null,
          schedule_text: String(fd.get("schedule_text") ?? "") || null,
          profile_data: profilSzkolyZFormularza(fd),
        }),
      "Dodano profil szkoły / przedszkola.",
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
          group_type: "szkola",
          name: String(fd.get("name") ?? ""),
          short_description: String(fd.get("short_description") ?? "") || null,
          contact_phone: String(fd.get("contact_phone") ?? "") || null,
          contact_email: String(fd.get("contact_email") ?? "") || null,
          meeting_place: String(fd.get("meeting_place") ?? "") || null,
          schedule_text: String(fd.get("schedule_text") ?? "") || null,
          profile_data: profilSzkolyZFormularza(fd),
        }),
      "Zaktualizowano profil placówki.",
    );
  }

  function usun(id: string, nazwa: string) {
    if (!window.confirm(`Ukryć „${nazwa}" na profilu wsi?`)) return;
    run(() => dezaktywujOrganizacjeWsi(id, villageId), "Profil został ukryty.");
  }

  const podgladHref = sciezkaProfilu ? `${sciezkaProfilu}#sekcja-szkola` : null;
  const polaProfilu = (p: ReturnType<typeof parsujProfilSzkoly>) => (
    <div className="mt-4 grid gap-3 md:grid-cols-2">
      <input name="szkola_dyrektor" placeholder="Dyrektor" defaultValue={p?.dyrektor ?? ""} className="rounded border border-stone-300 px-3 py-2 text-sm" />
      <input name="szkola_wicedyrektor" placeholder="Wicedyrektor" defaultValue={p?.wicedyrektor ?? ""} className="rounded border border-stone-300 px-3 py-2 text-sm" />
      <input name="szkola_adres" placeholder="Adres placówki" defaultValue={p?.adres_szkoly ?? ""} className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
      <input name="szkola_godziny_przyjec" placeholder="Godziny przyjęć rodziców" defaultValue={p?.godziny_przyjec ?? ""} className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
      <input name="szkola_sekretariat" placeholder="Sekretariat" defaultValue={p?.sekretariat ?? ""} className="rounded border border-stone-300 px-3 py-2 text-sm" />
      <input name="szkola_strona_www" placeholder="Strona www" defaultValue={p?.strona_www ?? ""} className="rounded border border-stone-300 px-3 py-2 text-sm" />
      <textarea name="szkola_dyzury" rows={2} placeholder="Dyżury nauczycieli" defaultValue={p?.dyzury_nauczycieli ?? ""} className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
      <textarea name="szkola_zajecia" rows={2} placeholder="Zajęcia pozalekcyjne" defaultValue={p?.zajecia_pozalekcyjne ?? ""} className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
      <input name="szkola_stolowka" placeholder="Stołówka" defaultValue={p?.stołówka ?? ""} className="rounded border border-stone-300 px-3 py-2 text-sm" />
      <input name="szkola_biblioteka" placeholder="Biblioteka szkolna" defaultValue={p?.biblioteka_szkolna ?? ""} className="rounded border border-stone-300 px-3 py-2 text-sm" />
      <textarea name="szkola_uwagi" rows={2} placeholder="Uwagi dla rodziców" defaultValue={p?.uwagi ?? ""} className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
    </div>
  );

  return (
    <section
      id="profil-szkoly"
      className="scroll-mt-24 rounded-2xl border border-sky-300/70 bg-gradient-to-br from-sky-50/60 via-white to-cyan-50/30 p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl text-sky-950">Szkoła / przedszkole — {villageName}</h2>
          <p className="mt-2 max-w-prose text-sm text-stone-600">
            Kontakt placówki na profilu wsi (<code className="rounded bg-sky-100 px-1">#sekcja-szkola</code>). Ogłoszenia dodajesz w{" "}
            <Link href="/panel/soltys/szkola" className="font-medium text-green-800 underline">
              panelu tablicy szkoły
            </Link>
            .
          </p>
        </div>
        {podgladHref ? (
          <Link
            href={podgladHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-sky-300 bg-white px-3 py-2 text-sm font-medium text-sky-900 hover:bg-sky-50"
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

      {szkoly.length > 0 ? (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-sky-900">Aktywne profile</h3>
          <ul className="mt-2 space-y-2">
            {szkoly.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm">
                <span>
                  <strong>{s.name}</strong>
                  {czyProfilSzkolyUzupelniony(parsujProfilSzkoly(s.profile_data)) ? (
                    <span className="ml-2 text-xs text-emerald-700">· profil uzupełniony</span>
                  ) : (
                    <span className="ml-2 text-xs text-amber-700">· uzupełnij szczegóły</span>
                  )}
                </span>
                <span className="flex gap-2">
                  <button type="button" className="text-xs font-medium text-sky-800 underline" onClick={() => ustawEdytujId(s.id)}>
                    Edytuj
                  </button>
                  <button type="button" className="text-xs text-red-700 underline" onClick={() => usun(s.id, s.name)}>
                    Ukryj
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <form
        onSubmit={edytowana ? onAktualizuj : onNowa}
        className="mt-6 rounded-xl border border-sky-100 bg-white/80 p-4"
      >
        <h3 className="text-sm font-semibold text-sky-900">{edytowana ? `Edycja: ${edytowana.name}` : "Nowa placówka"}</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            name="name"
            placeholder="Nazwa (np. Szkoła Podstawowa w …)"
            required
            defaultValue={edytowana?.name ?? ""}
            className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2"
          />
          <input name="contact_phone" placeholder="Telefon" defaultValue={edytowana?.contact_phone ?? ""} className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="contact_email" placeholder="E-mail" defaultValue={edytowana?.contact_email ?? ""} className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <textarea name="short_description" rows={2} placeholder="Krótki opis" defaultValue={edytowana?.short_description ?? ""} className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
        </div>
        {polaProfilu(profilEdycji)}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" disabled={pending} className="rounded-lg bg-sky-800 px-4 py-2 text-sm text-white hover:bg-sky-900 disabled:opacity-60">
            {pending ? "Zapisywanie…" : edytowana ? "Zapisz zmiany" : "Dodaj placówkę"}
          </button>
          {edytowana ? (
            <button type="button" className="text-sm text-stone-600 underline" onClick={() => ustawEdytujId(null)}>
              Anuluj edycję
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
