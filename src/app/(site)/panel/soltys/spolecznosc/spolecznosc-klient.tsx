"use client";

import { FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  dodajMarketplaceOferte,
  dodajOrganizacjeWsi,
  dodajProfilBlogeraWsi,
  dodajSlotHarmonogramuTygodniaWsi,
  dodajWiadomoscLokalna,
  dodajWpisBlogaWsi,
  dodajWpisHistoriiWsi,
  dodajWydarzenieSpolecznosciWsi,
  dodajZrodloDotacjiWsi,
  uruchomAutomatyzacjeWsi,
  usunSlotHarmonogramuTygodniaWsi,
  usunZrodloDotacjiWsi,
  zapiszMarketplaceProfil,
} from "../akcje";
import { etykietaKategoriiDotacji, nazwaDniaTygodnia } from "@/lib/wies/teksty-dotacji";

export type WiesDoModeracjiSpolecznosci = {
  id: string;
  name: string;
};

export type GrupaOrganizacjiWiersz = {
  id: string;
  village_id: string;
  name: string;
};

export type SlotHarmonogramuWiersz = {
  id: string;
  village_id: string;
  day_of_week: number;
  time_start: string;
  time_end: string | null;
  title: string;
};

export type ZrodloDotacjiWiersz = {
  id: string;
  village_id: string;
  title: string;
  category: string;
};

export function SoltysSpolecznoscKlient({
  wsie,
  grupyOrganizacji = [],
  slotyHarmonogramu = [],
  zrodlaDotacji = [],
}: {
  wsie: WiesDoModeracjiSpolecznosci[];
  grupyOrganizacji?: GrupaOrganizacjiWiersz[];
  slotyHarmonogramu?: SlotHarmonogramuWiersz[];
  zrodlaDotacji?: ZrodloDotacjiWiersz[];
}) {
  const router = useRouter();
  const [villageId, setVillageId] = useState(wsie[0]?.id ?? "");
  const [czek, startT] = useTransition();
  const [komunikat, setKomunikat] = useState<string>("");
  const [blad, setBlad] = useState<string>("");

  const villageName = useMemo(() => wsie.find((w) => w.id === villageId)?.name ?? "Wybrana wieś", [wsie, villageId]);

  const grupyDlaWybranejWsi = useMemo(
    () => grupyOrganizacji.filter((g) => g.village_id === villageId),
    [grupyOrganizacji, villageId],
  );

  const slotyDlaWybranejWsi = useMemo(
    () => slotyHarmonogramu.filter((s) => s.village_id === villageId),
    [slotyHarmonogramu, villageId],
  );

  const dotacjeDlaWybranejWsi = useMemo(
    () => zrodlaDotacji.filter((z) => z.village_id === villageId),
    [zrodlaDotacji, villageId],
  );

  function runAction(run: () => Promise<{ ok?: true; blad?: string }>, msg: string) {
    setBlad("");
    setKomunikat("");
    startT(async () => {
      const wynik = await run();
      if ("blad" in wynik && wynik.blad) {
        setBlad(wynik.blad);
        return;
      }
      setKomunikat(msg);
      router.refresh();
    });
  }

  function onDodajBlogera(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    runAction(
      () =>
        dodajProfilBlogeraWsi({
          villageId,
          display_name: String(fd.get("display_name") ?? ""),
          bio: String(fd.get("bio") ?? "") || null,
          avatar_url: String(fd.get("avatar_url") ?? "") || null,
          specialties_csv: String(fd.get("specialties_csv") ?? ""),
        }),
      "Zapisano profil blogera."
    );
  }

  function onDodajBlog(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    runAction(
      () =>
        dodajWpisBlogaWsi({
          villageId,
          title: String(fd.get("title") ?? ""),
          excerpt: String(fd.get("excerpt") ?? "") || null,
          body: String(fd.get("body") ?? ""),
          slug: String(fd.get("slug") ?? ""),
          cover_image_url: String(fd.get("cover_image_url") ?? "") || null,
          tags_csv: String(fd.get("tags_csv") ?? ""),
        }),
      "Dodano wpis blogowy i opublikowano."
    );
  }

  function onDodajHistorie(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    runAction(
      () =>
        dodajWpisHistoriiWsi({
          villageId,
          title: String(fd.get("title") ?? ""),
          short_description: String(fd.get("short_description") ?? "") || null,
          body: String(fd.get("body") ?? ""),
          event_date: String(fd.get("event_date") ?? "") || null,
          era_label: String(fd.get("era_label") ?? "") || null,
          source_links_csv: String(fd.get("source_links_csv") ?? ""),
        }),
      "Dodano wpis historii i opublikowano."
    );
  }

  function onZapiszProfilUslug(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    runAction(
      () =>
        zapiszMarketplaceProfil({
          villageId,
          business_name: String(fd.get("business_name") ?? ""),
          short_description: String(fd.get("short_description") ?? "") || null,
          details: String(fd.get("details") ?? "") || null,
          phone: String(fd.get("phone") ?? "") || null,
          email: String(fd.get("email") ?? "") || null,
          website: String(fd.get("website") ?? "") || null,
          categories_csv: String(fd.get("categories_csv") ?? ""),
          service_area: String(fd.get("service_area") ?? "") || null,
        }),
      "Zapisano profil usługodawcy."
    );
  }

  function onDodajOferte(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    runAction(
      () =>
        dodajMarketplaceOferte({
          villageId,
          listing_type: String(fd.get("listing_type") ?? "usluga") as "sprzedam" | "kupie" | "oddam" | "usluga" | "praca",
          title: String(fd.get("title") ?? ""),
          description: String(fd.get("description") ?? ""),
          category: String(fd.get("category") ?? "") || null,
          price_amount:
            String(fd.get("price_amount") ?? "").trim() === ""
              ? null
              : Number(String(fd.get("price_amount") ?? "")),
          phone: String(fd.get("phone") ?? "") || null,
          location_text: String(fd.get("location_text") ?? "") || null,
          expires_in_days: Number(fd.get("expires_in_days") ?? 30),
        }),
      "Dodano darmowe ogłoszenie marketplace."
    );
  }

  function onDodajOrganizacje(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    runAction(
      () =>
        dodajOrganizacjeWsi({
          villageId,
          group_type: String(fd.get("group_type") ?? "inne") as
            | "kgw"
            | "sport"
            | "taniec"
            | "muzyka"
            | "kolo"
            | "inne",
          name: String(fd.get("name") ?? ""),
          short_description: String(fd.get("short_description") ?? "") || null,
          contact_phone: String(fd.get("contact_phone") ?? "") || null,
          contact_email: String(fd.get("contact_email") ?? "") || null,
          meeting_place: String(fd.get("meeting_place") ?? "") || null,
          schedule_text: String(fd.get("schedule_text") ?? "") || null,
        }),
      "Dodano organizację (KGW, klub, zespół…)."
    );
  }

  function onDodajWydarzenie(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    runAction(
      () =>
        dodajWydarzenieSpolecznosciWsi({
          villageId,
          group_id: String(fd.get("group_id") ?? ""),
          event_kind: String(fd.get("event_kind") ?? "inne") as
            | "mecz"
            | "wyjazd"
            | "proba"
            | "wystep"
            | "spotkanie"
            | "festyn"
            | "inne",
          title: String(fd.get("title") ?? ""),
          description: String(fd.get("description") ?? "") || null,
          location_text: String(fd.get("location_text") ?? "") || null,
          starts_at: String(fd.get("starts_at") ?? ""),
          ends_at: String(fd.get("ends_at") ?? "") || null,
          expires_in_days: Number(fd.get("expires_in_days") ?? 365),
        }),
      "Dodano wydarzenie do kalendarza wsi."
    );
  }

  function onDodajHarmonogram(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    runAction(
      () =>
        dodajSlotHarmonogramuTygodniaWsi({
          villageId,
          day_of_week: Number(fd.get("day_of_week") ?? 0),
          time_start: String(fd.get("time_start") ?? ""),
          time_end: String(fd.get("time_end") ?? "") || null,
          title: String(fd.get("title") ?? ""),
          description: String(fd.get("description") ?? "") || null,
          group_id: String(fd.get("group_id") ?? ""),
        }),
      "Dodano stałe zajęcia do planu tygodnia."
    );
  }

  function onDodajDotacje(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    runAction(
      () =>
        dodajZrodloDotacjiWsi({
          villageId,
          category: String(fd.get("category") ?? "inne") as
            | "fundusz_solecki"
            | "gmina_powiat_woj"
            | "ue_prow"
            | "ngo_fundacja"
            | "sponsor"
            | "inne",
          title: String(fd.get("title") ?? ""),
          summary: String(fd.get("summary") ?? "") || null,
          body: String(fd.get("body") ?? "") || null,
          source_url: String(fd.get("source_url") ?? "") || null,
          amount_hint: String(fd.get("amount_hint") ?? "") || null,
          application_deadline: String(fd.get("application_deadline") ?? "") || null,
        }),
      "Zapisano informację o dofinansowaniu."
    );
  }

  function onDodajWiadomosc(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    runAction(
      () =>
        dodajWiadomoscLokalna({
          villageId,
          title: String(fd.get("title") ?? ""),
          summary: String(fd.get("summary") ?? "") || null,
          body: String(fd.get("body") ?? "") || null,
          category: String(fd.get("category") ?? "") || null,
          source_name: String(fd.get("source_name") ?? "") || null,
          source_url: String(fd.get("source_url") ?? "") || null,
          is_automated: Boolean(fd.get("is_automated")),
          expires_in_days: Number(fd.get("expires_in_days") ?? 14),
        }),
      "Dodano lokalną wiadomość."
    );
  }

  return (
    <section className="mt-6 space-y-8">
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-stone-800" htmlFor="wies-select">
          Aktywna wieś
        </label>
        <select
          id="wies-select"
          className="mt-2 w-full max-w-sm rounded border border-stone-300 px-3 py-2 text-sm"
          value={villageId}
          onChange={(e) => setVillageId(e.target.value)}
        >
          {wsie.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-stone-500">Wszystkie formularze poniżej zapisują dane dla: {villageName}.</p>
        {komunikat ? (
          <p className="mt-3 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">{komunikat}</p>
        ) : null}
        {blad ? <p className="mt-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">{blad}</p> : null}
      </div>

      <form onSubmit={onDodajOrganizacje} className="rounded-2xl border border-rose-200/80 bg-gradient-to-br from-rose-50/40 to-white p-5 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Koła, kluby i grupy (KGW, sport, taniec, muzyka)</h2>
        <p className="mt-1 text-sm text-stone-600">
          Widoczne na publicznym profilu wsi — mieszkańcy zobaczą kontakt, miejsce spotkań i harmonogram (np. próby zespołu,
          zebrań KGW).
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select name="group_type" className="rounded border border-stone-300 px-3 py-2 text-sm" required>
            <option value="kgw">Koło Gospodyń Wiejskich</option>
            <option value="sport">Klub / sport / OSP</option>
            <option value="taniec">Grupa taneczna</option>
            <option value="muzyka">Zespół / muzyka</option>
            <option value="kolo">Koło łowieckie / inne koło</option>
            <option value="inne">Inna organizacja</option>
          </select>
          <input name="name" placeholder="Nazwa (np. KGW w …)" required className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="meeting_place" placeholder="Miejsce spotkań (świetlica, remiza…)" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <textarea name="schedule_text" rows={2} placeholder="Terminy (np. wtorki 17:00, mecze w niedziele)" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <input name="contact_phone" placeholder="Telefon" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="contact_email" placeholder="E-mail" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <textarea name="short_description" rows={3} placeholder="Krótki opis działalności" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
        </div>
        <button disabled={czek || !villageId} className="mt-4 rounded-lg bg-rose-800 px-4 py-2 text-sm text-white hover:bg-rose-900 disabled:opacity-60">
          Zapisz organizację
        </button>
      </form>

      <form onSubmit={onDodajWydarzenie} className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/50 to-white p-5 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Kalendarz: mecz, wyjazd, próba, festyn…</h2>
        <p className="mt-1 text-sm text-stone-600">
          Wpis trafia na profil wsi i na listę <strong>/wydarzenia</strong>. Możesz powiązać wydarzenie z organizacją lub
          dodać ogólne (np. mecz bez przypisanego klubu).
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select name="event_kind" className="rounded border border-stone-300 px-3 py-2 text-sm">
            <option value="mecz">Mecz / zawody</option>
            <option value="wyjazd">Wyjazd / wycieczka</option>
            <option value="proba">Próba / zajęcia</option>
            <option value="wystep">Występ / koncert</option>
            <option value="spotkanie">Spotkanie</option>
            <option value="festyn">Festyn / impreza</option>
            <option value="inne">Inne</option>
          </select>
          <select name="group_id" className="rounded border border-stone-300 px-3 py-2 text-sm">
            <option value="">— bez przypisanej grupy —</option>
            {grupyDlaWybranejWsi.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <input name="title" placeholder="Tytuł (np. Mecz z …)" required className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <input name="location_text" placeholder="Miejsce (boisko, świetlica, gmina X)" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <label className="text-xs text-stone-600 md:col-span-2">
            Start
            <input name="starts_at" type="datetime-local" required className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs text-stone-600 md:col-span-2">
            Koniec (opcjonalnie)
            <input name="ends_at" type="datetime-local" className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm" />
          </label>
          <textarea name="description" rows={3} placeholder="Opis, godziny zbiórki autokaru, bilety…" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <label className="text-xs text-stone-600 md:col-span-2">
            Ważność wpisu w kalendarzu (dni — potem archiwizacja automatyczna)
            <input name="expires_in_days" type="number" min={7} max={730} defaultValue={365} className="mt-1 w-full max-w-xs rounded border border-stone-300 px-3 py-2 text-sm" />
          </label>
        </div>
        <button disabled={czek || !villageId} className="mt-4 rounded-lg bg-indigo-800 px-4 py-2 text-sm text-white hover:bg-indigo-900 disabled:opacity-60">
          Opublikuj wydarzenie
        </button>
      </form>

      <form onSubmit={onDodajHarmonogram} className="rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/40 to-white p-5 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Plan stałych zajęć (tydzień)</h2>
        <p className="mt-1 text-sm text-stone-600">
          Powtarzalne terminy (np. próba zespołu co wtorek). Jednorazowe imprezy dodawaj w kalendarzu wydarzeń powyżej.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select name="day_of_week" className="rounded border border-stone-300 px-3 py-2 text-sm" required>
            <option value={0}>Niedziela</option>
            <option value={1}>Poniedziałek</option>
            <option value={2}>Wtorek</option>
            <option value={3}>Środa</option>
            <option value={4}>Czwartek</option>
            <option value={5}>Piątek</option>
            <option value={6}>Sobota</option>
          </select>
          <select name="group_id" className="rounded border border-stone-300 px-3 py-2 text-sm">
            <option value="">— bez przypisanej grupy —</option>
            {grupyDlaWybranejWsi.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <label className="text-xs text-stone-600">
            Od (godz.)
            <input name="time_start" type="time" required className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs text-stone-600">
            Do (opcjonalnie)
            <input name="time_end" type="time" className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm" />
          </label>
          <input name="title" placeholder="Np. Próba zespołu" required className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <textarea name="description" rows={2} placeholder="Miejsce, uwagi" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
        </div>
        <button disabled={czek || !villageId} className="mt-4 rounded-lg bg-teal-800 px-4 py-2 text-sm text-white hover:bg-teal-900 disabled:opacity-60">
          Dodaj do planu tygodnia
        </button>
        {slotyDlaWybranejWsi.length > 0 ? (
          <ul className="mt-6 space-y-2 border-t border-teal-100 pt-4 text-sm">
            {slotyDlaWybranejWsi.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-stone-200 bg-white px-3 py-2">
                <span>
                  <strong>{nazwaDniaTygodnia(s.day_of_week)}</strong> {s.time_start.slice(0, 5)}
                  {s.time_end ? `–${s.time_end.slice(0, 5)}` : ""} — {s.title}
                </span>
                <button
                  type="button"
                  disabled={czek}
                  className="text-xs text-red-700 underline disabled:opacity-50"
                  onClick={() =>
                    runAction(() => usunSlotHarmonogramuTygodniaWsi(s.id), "Usunięto wpis z planu tygodnia.")
                  }
                >
                  Usuń
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </form>

      <form onSubmit={onDodajDotacje} className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/40 to-white p-5 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Źródła dofinansowania (informacyjnie)</h2>
        <p className="mt-1 text-sm text-stone-600">
          Skrót programu, link do naboru, orientacyjna kwota — bez obietnic prawnych. Pełna lista na profilu: /dotacje.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select name="category" className="rounded border border-stone-300 px-3 py-2 text-sm">
            <option value="fundusz_solecki">Fundusz sołecki</option>
            <option value="gmina_powiat_woj">Gmina / powiat / województwo</option>
            <option value="ue_prow">UE / PROW / programy krajowe</option>
            <option value="ngo_fundacja">Fundacje i NGO</option>
            <option value="sponsor">Sponsorzy</option>
            <option value="inne">Inne</option>
          </select>
          <input name="application_deadline" type="date" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="title" placeholder="Tytuł (np. Fundusz sołecki 2026)" required className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <input name="amount_hint" placeholder="Kwota / przykład (np. do 20 tys. zł)" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <input name="source_url" placeholder="https://… (strona naboru)" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <textarea name="summary" rows={2} placeholder="Krótki opis dla listy" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <textarea name="body" rows={4} placeholder="Szczegóły, warunki, przypisy (opcjonalnie)" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
        </div>
        <button disabled={czek || !villageId} className="mt-4 rounded-lg bg-emerald-800 px-4 py-2 text-sm text-white hover:bg-emerald-900 disabled:opacity-60">
          Opublikuj wpis o dofinansowaniu
        </button>
        {dotacjeDlaWybranejWsi.length > 0 ? (
          <ul className="mt-6 space-y-2 border-t border-emerald-100 pt-4 text-sm">
            {dotacjeDlaWybranejWsi.map((z) => (
              <li key={z.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-stone-200 bg-white px-3 py-2">
                <span>
                  <span className="text-xs text-emerald-900">{etykietaKategoriiDotacji(z.category)}</span>
                  <br />
                  {z.title}
                </span>
                <button
                  type="button"
                  disabled={czek}
                  className="text-xs text-red-700 underline disabled:opacity-50"
                  onClick={() => runAction(() => usunZrodloDotacjiWsi(z.id), "Usunięto wpis o dofinansowaniu.")}
                >
                  Usuń
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </form>

      <form onSubmit={onDodajBlogera} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Profil blogera / kronikarza</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="display_name" placeholder="Nazwa autora" required className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="avatar_url" placeholder="URL avatara (opcjonalnie)" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="specialties_csv" placeholder="Tematy, oddziel przecinkami" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <textarea name="bio" rows={3} placeholder="Krótki opis autora" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
        </div>
        <button disabled={czek || !villageId} className="mt-4 rounded-lg bg-green-800 px-4 py-2 text-sm text-white hover:bg-green-900 disabled:opacity-60">
          Zapisz profil blogera
        </button>
      </form>

      <form onSubmit={onDodajBlog} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Nowy wpis blogowy</h2>
        <div className="mt-4 grid gap-3">
          <input name="title" placeholder="Tytuł wpisu" required className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="slug" placeholder="slug, np. zycie-wsi-maj-2026" required className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="cover_image_url" placeholder="URL okładki (opcjonalnie)" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="tags_csv" placeholder="Tagi oddziel przecinkami" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <textarea name="excerpt" rows={2} placeholder="Krótki lead (opcjonalnie)" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <textarea name="body" rows={6} placeholder="Treść wpisu" required className="rounded border border-stone-300 px-3 py-2 text-sm" />
        </div>
        <button disabled={czek || !villageId} className="mt-4 rounded-lg bg-green-800 px-4 py-2 text-sm text-white hover:bg-green-900 disabled:opacity-60">
          Opublikuj wpis blogowy
        </button>
      </form>

      <form onSubmit={onDodajHistorie} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Nowy wpis historii wsi</h2>
        <div className="mt-4 grid gap-3">
          <input name="title" placeholder="Tytuł wpisu historycznego" required className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <div className="grid gap-3 md:grid-cols-2">
            <input name="event_date" type="date" className="rounded border border-stone-300 px-3 py-2 text-sm" />
            <input name="era_label" placeholder="Epoka / okres (opcjonalnie)" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          </div>
          <textarea name="short_description" rows={2} placeholder="Skrót wpisu (opcjonalnie)" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <textarea name="body" rows={6} placeholder="Opis historii, wspomnienie, kontekst" required className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="source_links_csv" placeholder="Linki źródłowe oddziel przecinkami" className="rounded border border-stone-300 px-3 py-2 text-sm" />
        </div>
        <button disabled={czek || !villageId} className="mt-4 rounded-lg bg-green-800 px-4 py-2 text-sm text-white hover:bg-green-900 disabled:opacity-60">
          Opublikuj wpis historii
        </button>
      </form>

      <form onSubmit={onZapiszProfilUslug} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Profil usług lokalnych</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="business_name" placeholder="Nazwa działalności / usługi" required className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <input name="phone" placeholder="Telefon" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="email" placeholder="E-mail" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="website" placeholder="Strona www" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <input name="service_area" placeholder="Obszar działania" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <input name="categories_csv" placeholder="Kategorie usług oddziel przecinkami" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <textarea name="short_description" rows={2} placeholder="Krótki opis" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <textarea name="details" rows={3} placeholder="Szczegóły oferty (opcjonalnie)" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
        </div>
        <button disabled={czek || !villageId} className="mt-4 rounded-lg bg-green-800 px-4 py-2 text-sm text-white hover:bg-green-900 disabled:opacity-60">
          Zapisz profil usług
        </button>
      </form>

      <form onSubmit={onDodajOferte} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Darmowe ogłoszenie marketplace</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select name="listing_type" className="rounded border border-stone-300 px-3 py-2 text-sm">
            <option value="sprzedam">Sprzedam</option>
            <option value="kupie">Kupię</option>
            <option value="oddam">Oddam</option>
            <option value="usluga">Usługa</option>
            <option value="praca">Praca</option>
          </select>
          <input name="category" placeholder="Kategoria" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="title" placeholder="Tytuł oferty" required className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <textarea name="description" rows={4} placeholder="Opis oferty" required className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <input name="price_amount" placeholder="Cena (opcjonalnie)" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="phone" placeholder="Telefon kontaktowy" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="location_text" placeholder="Lokalizacja (np. część wsi)" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="expires_in_days" type="number" min={1} max={180} defaultValue={30} className="rounded border border-stone-300 px-3 py-2 text-sm" />
        </div>
        <button disabled={czek || !villageId} className="mt-4 rounded-lg bg-green-800 px-4 py-2 text-sm text-white hover:bg-green-900 disabled:opacity-60">
          Opublikuj darmowe ogłoszenie
        </button>
      </form>

      <form onSubmit={onDodajWiadomosc} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-serif text-xl text-green-950">Lokalna wiadomość (także automatyczna)</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="title" placeholder="Tytuł wiadomości" required className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <textarea name="summary" rows={2} placeholder="Krótki skrót" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <textarea name="body" rows={4} placeholder="Treść (opcjonalnie)" className="rounded border border-stone-300 px-3 py-2 text-sm md:col-span-2" />
          <input name="category" placeholder="Kategoria (np. bezpieczeństwo)" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="expires_in_days" type="number" min={1} max={90} defaultValue={14} className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="source_name" placeholder="Źródło (opcjonalnie)" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <input name="source_url" placeholder="Link źródłowy (opcjonalnie)" className="rounded border border-stone-300 px-3 py-2 text-sm" />
          <label className="inline-flex items-center gap-2 text-sm text-stone-700 md:col-span-2">
            <input name="is_automated" type="checkbox" />
            To wpis automatyczny (np. z agregacji wiadomości lokalnych)
          </label>
        </div>
        <button disabled={czek || !villageId} className="mt-4 rounded-lg bg-green-800 px-4 py-2 text-sm text-white hover:bg-green-900 disabled:opacity-60">
          Opublikuj wiadomość
        </button>
      </form>

      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5">
        <h2 className="font-serif text-xl text-green-950">Automatyzacje porządkujące</h2>
        <p className="mt-2 text-sm text-stone-700">
          Uruchamia automatyczne archiwizowanie wygasłych ogłoszeń i wiadomości.
        </p>
        <button
          disabled={czek || !villageId}
          onClick={() =>
            runAction(() => uruchomAutomatyzacjeWsi({ villageId }), "Automatyzacje uruchomione i dane odświeżone.")
          }
          className="mt-4 rounded-lg bg-stone-900 px-4 py-2 text-sm text-white hover:bg-black disabled:opacity-60"
        >
          Uruchom automatyzacje teraz
        </button>
      </div>
    </section>
  );
}
