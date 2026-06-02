"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  aktualizujOrganizacjeWsi,
  dodajOrganizacjeWsi,
} from "@/app/(site)/panel/soltys/akcje";
import { PRESETY_DYSCYPLIN_SPORTOWYCH } from "@/lib/wies/dyscypliny-sportowe";
import { czyOrganizacjaSport } from "@/lib/wies/sport";
import {
  czyProfilKlubuSportowegoUzupelniony,
  parsujProfilKlubuSportowego,
  profilKlubuSportowegoZFormularza,
} from "@/lib/wies/profil-klubu-sportowego";
import type { OrganizacjaPelna } from "@/lib/wies/profil-organizacji";
import { PolaOkladkiOrganizacji } from "@/components/panel/soltys/pola-okladki-organizacji";

export function ProfilKlubuSportowegoKlient({
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

  const kluby = useMemo(
    () => organizacje.filter((o) => o.village_id === villageId && czyOrganizacjaSport(o.group_type, o.name)),
    [organizacje, villageId],
  );

  const edytowana = useMemo(
    () => (edytujId ? kluby.find((p) => p.id === edytujId) ?? null : null),
    [edytujId, kluby],
  );

  const profilEdycji = useMemo(() => parsujProfilKlubuSportowego(edytowana?.profile_data) ?? null, [edytowana]);

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

  function polaProfilu(p: ReturnType<typeof parsujProfilKlubuSportowego>) {
    const preset = p?.dyscyplina_preset ?? "";
    return (
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-stone-600 sm:col-span-2">
          Dyscyplina
          <select
            name="sport_dyscyplina_preset"
            defaultValue={preset || "inne"}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
          >
            {PRESETY_DYSCYPLIN_SPORTOWYCH.map((d) => (
              <option key={d.kod} value={d.kod}>
                {d.etykieta}
              </option>
            ))}
          </select>
        </label>
        <input name="sport_dyscyplina" placeholder="Własna nazwa (gdy „Inna dyscyplina”)" defaultValue={p?.dyscyplina ?? ""} className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
        <input name="sport_trener" placeholder="Trener / opiekun" defaultValue={p?.trener ?? ""} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        <input name="sport_strona_www" placeholder="Strona www" defaultValue={p?.strona_www ?? ""} className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
        <input name="sport_facebook" placeholder="Facebook" defaultValue={p?.facebook ?? ""} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        <input name="sport_instagram" placeholder="Instagram" defaultValue={p?.instagram ?? ""} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        <input name="sport_strava" placeholder="Strava (klub lub profil)" defaultValue={p?.strava ?? ""} className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
        <input name="sport_skladka" placeholder="Składka / opłaty" defaultValue={p?.skladka ?? ""} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        <input name="sport_stroje" placeholder="Kolory strojów" defaultValue={p?.stroje_kolory ?? ""} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        <textarea name="sport_rekrutacja" rows={2} placeholder="Rekrutacja — kogo szukamy" defaultValue={p?.rekrutacja ?? ""} className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
        <textarea name="sport_uwagi" rows={2} placeholder="Uwagi dla kibiców i rodziców" defaultValue={p?.uwagi ?? ""} className="rounded-lg border border-stone-300 px-3 py-2 text-sm sm:col-span-2" />
      </div>
    );
  }

  function onNowa(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    run(
      () =>
        dodajOrganizacjeWsi({
          villageId,
          group_type: "sport",
          name: String(fd.get("name") ?? ""),
          short_description: String(fd.get("short_description") ?? "") || null,
          contact_phone: String(fd.get("contact_phone") ?? "") || null,
          contact_email: String(fd.get("contact_email") ?? "") || null,
          meeting_place: String(fd.get("meeting_place") ?? "") || null,
          schedule_text: String(fd.get("schedule_text") ?? "") || null,
          profile_data: profilKlubuSportowegoZFormularza(fd),
        }),
      "Dodano klub sportowy.",
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
          group_type: "sport",
          name: String(fd.get("name") ?? ""),
          short_description: String(fd.get("short_description") ?? "") || null,
          contact_phone: String(fd.get("contact_phone") ?? "") || null,
          contact_email: String(fd.get("contact_email") ?? "") || null,
          meeting_place: String(fd.get("meeting_place") ?? "") || null,
          schedule_text: String(fd.get("schedule_text") ?? "") || null,
          profile_data: profilKlubuSportowegoZFormularza(fd),
        }),
      "Zaktualizowano klub.",
    );
  }

  return (
    <div className="space-y-6 rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-5">
      <h2 className="font-serif text-xl text-green-950">Profil klubu sportowego — {villageName}</h2>
      <p className="text-sm text-stone-600">
        Dane trafiają na{" "}
        {sciezkaProfilu ? (
          <Link href={`${sciezkaProfilu}#sekcja-sport`} className="font-medium text-green-800 underline" target="_blank">
            zakładkę Sport
          </Link>
        ) : (
          "zakładkę Sport"
        )}
        . Terminy meczów dodajesz w sekcji Wydarzenia (rodzaj: mecz / próba).
      </p>

      {kluby.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {kluby.map((k) => (
            <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white bg-white/80 px-3 py-2">
              <span>
                <strong>{k.name}</strong>
                {czyProfilKlubuSportowegoUzupelniony(parsujProfilKlubuSportowego(k.profile_data)) ? " · profil ✓" : ""}
              </span>
              <button type="button" className="text-xs font-medium text-green-800 underline" onClick={() => ustawEdytujId(k.id)}>
                Edytuj
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={edytujId ? onAktualizuj : onNowa} className="space-y-3">
        <h3 className="font-medium text-stone-900">{edytujId ? "Edycja klubu" : "Nowy klub"}</h3>
        <input name="name" required placeholder="Nazwa (np. LKS Studzienki)" defaultValue={edytowana?.name ?? ""} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        <PolaOkladkiOrganizacji prefix="sport" villageId={villageId} okladkaUrl={profilEdycji?.okladka_url} haslo={profilEdycji?.haslo} />
        <textarea name="short_description" rows={2} placeholder="Krótki opis" defaultValue={edytowana?.short_description ?? ""} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        <input name="meeting_place" placeholder="Boisko / hala" defaultValue={edytowana?.meeting_place ?? ""} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        <textarea name="schedule_text" rows={2} placeholder="Stałe godziny (tekst)" defaultValue={edytowana?.schedule_text ?? ""} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="contact_phone" placeholder="Telefon" defaultValue={edytowana?.contact_phone ?? ""} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
          <input name="contact_email" placeholder="E-mail" defaultValue={edytowana?.contact_email ?? ""} className="rounded-lg border border-stone-300 px-3 py-2 text-sm" />
        </div>
        {polaProfilu(profilEdycji)}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} className="rounded-lg bg-green-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">
            {pending ? "Zapisuję…" : edytujId ? "Zapisz" : "Dodaj klub"}
          </button>
          {edytujId ? (
            <button type="button" onClick={() => ustawEdytujId(null)} className="rounded-lg border border-stone-300 px-4 py-2 text-sm">
              Anuluj
            </button>
          ) : null}
        </div>
      </form>
      {komunikat ? <p className="text-sm text-green-800">{komunikat}</p> : null}
      {blad ? <p className="text-sm text-red-700">{blad}</p> : null}
    </div>
  );
}
