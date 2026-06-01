"use client";

import Link from "next/link";
import { FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QrTablicaSzkolyKlient } from "@/components/wies/qr-tablica-szkoly-klient";
import {
  dodajOgloszenieSzkoly,
  edytujOgloszenieSzkoly,
  przedluzOgloszenieSzkoly,
  przypnijOgloszenieSzkoly,
  usunOgloszenieSzkoly,
} from "@/lib/szkola/akcje-szkola";
import { urlRssTablicySzkoly } from "@/lib/szkola/rss-szkoly";
import {
  AUDIENCJE_OGLOSZEN_SZKOLY,
  ETYKIETY_AUDIENCJI_SZKOLY,
  SZABLONY_OGLOSZEN_SZKOLY,
  type AudiencjaOgloszeniaSzkoly,
  type OgloszenieSzkolyPanel,
} from "@/lib/szkola/teksty-szkoly";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { KodyEmbedWsiKlient } from "@/components/wies/kody-embed-wsi-klient";

type WiesSzkola = {
  id: string;
  name: string;
  voivodeship: string;
  county: string;
  commune: string;
  slug: string;
};

type GrupaSzkola = { id: string; name: string };

export function SzkolaPanelKlient({
  wsie,
  ogloszeniaPoWsi,
  grupyPoWsi,
}: {
  wsie: WiesSzkola[];
  ogloszeniaPoWsi: Record<string, OgloszenieSzkolyPanel[]>;
  grupyPoWsi: Record<string, GrupaSzkola[]>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [villageId, ustawVillageId] = useState(wsie[0]?.id ?? "");
  const [blad, ustawBlad] = useState("");
  const [komunikat, ustawKomunikat] = useState<"" | "dodano" | "zapisano">("");
  const [edytowanyId, ustawEdytowanyId] = useState<string | null>(null);
  const [czek, startT] = useTransition();

  const wies = wsie.find((w) => w.id === villageId) ?? wsie[0];
  const ogloszenia = ogloszeniaPoWsi[villageId] ?? [];
  const grupy = grupyPoWsi[villageId] ?? [];
  const sciezka = wies ? sciezkaProfiluWsi(wies) : "/";

  function wyslij(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!wies) return;
    const fd = new FormData(e.currentTarget);
    ustawBlad("");
    ustawKomunikat("");
    const payload = {
      villageId: wies.id,
      school_group_id: String(fd.get("school_group_id") || "") || null,
      title: String(fd.get("title") ?? ""),
      body: String(fd.get("body") ?? "") || null,
      audience: String(fd.get("audience") ?? "ogolne") as AudiencjaOgloszeniaSzkoly,
      class_label: String(fd.get("class_label") ?? "") || null,
      is_pinned: fd.get("is_pinned") === "on",
      attachment_url: String(fd.get("attachment_url") ?? "") || null,
      valid_until_days: Number(fd.get("valid_until_days") ?? 0) || 0,
    };
    startT(async () => {
      const wynik = edytowanyId
        ? await edytujOgloszenieSzkoly({ ...payload, id: edytowanyId })
        : await dodajOgloszenieSzkoly({
            ...payload,
            valid_until_days: payload.valid_until_days || 14,
          });
      if ("blad" in wynik) {
        ustawBlad(wynik.blad);
        return;
      }
      const bylEdycja = Boolean(edytowanyId);
      ustawEdytowanyId(null);
      ustawKomunikat(bylEdycja ? "zapisano" : "dodano");
      e.currentTarget.reset();
      router.refresh();
    });
  }

  function rozpocznijEdycje(o: OgloszenieSzkolyPanel) {
    ustawEdytowanyId(o.id);
    ustawKomunikat("");
    ustawBlad("");
    if (!formRef.current) return;
    const f = formRef.current;
    (f.elements.namedItem("title") as HTMLInputElement).value = o.title;
    (f.elements.namedItem("body") as HTMLTextAreaElement).value = o.body ?? "";
    (f.elements.namedItem("audience") as HTMLSelectElement).value = o.audience;
    (f.elements.namedItem("class_label") as HTMLInputElement).value = o.class_label ?? "";
    (f.elements.namedItem("attachment_url") as HTMLInputElement).value = o.attachment_url ?? "";
    (f.elements.namedItem("valid_until_days") as HTMLInputElement).value = "0";
    const pin = f.elements.namedItem("is_pinned") as HTMLInputElement;
    pin.checked = o.is_pinned;
    const grp = f.elements.namedItem("school_group_id") as HTMLSelectElement;
    if (grp) grp.value = o.school_group_id ?? "";
    formRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function anulujEdycje() {
    ustawEdytowanyId(null);
    formRef.current?.reset();
  }

  function przedluz(id: string) {
    if (!wies) return;
    startT(async () => {
      const wynik = await przedluzOgloszenieSzkoly({ id, villageId: wies.id, dni: 14 });
      if ("blad" in wynik) ustawBlad(wynik.blad);
      else router.refresh();
    });
  }

  async function kopiujLinkOgloszenia(id: string) {
    if (!wies || typeof window === "undefined") return;
    const url = `${window.location.origin}${sciezka}#ogl-szkola-${id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      ustawBlad("Nie udało się skopiować linku.");
    }
  }

  function usun(id: string) {
    if (!wies || !confirm("Usunąć to ogłoszenie?")) return;
    startT(async () => {
      const wynik = await usunOgloszenieSzkoly({ id, villageId: wies.id });
      if ("blad" in wynik) ustawBlad(wynik.blad);
      else router.refresh();
    });
  }

  function przypnij(id: string, teraz: boolean) {
    if (!wies) return;
    startT(async () => {
      const wynik = await przypnijOgloszenieSzkoly({ id, villageId: wies.id, is_pinned: !teraz });
      if ("blad" in wynik) ustawBlad(wynik.blad);
      else router.refresh();
    });
  }

  function zastosujSzablon(idx: number) {
    const s = SZABLONY_OGLOSZEN_SZKOLY[idx];
    if (!s || !formRef.current) return;
    const f = formRef.current;
    (f.elements.namedItem("title") as HTMLInputElement).value = s.title;
    (f.elements.namedItem("body") as HTMLTextAreaElement).value = s.body;
    (f.elements.namedItem("audience") as HTMLSelectElement).value = s.audience;
  }

  if (!wies) return null;

  return (
    <div className="space-y-8">
      {wsie.length > 1 ? (
        <label className="block text-sm">
          <span className="font-medium text-stone-700">Wieś</span>
          <select className="form-control mt-1 max-w-md" value={villageId} onChange={(e) => ustawVillageId(e.target.value)}>
            {wsie.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <p className="text-sm text-stone-600">
        Tablica na profilu:{" "}
        <Link href={`${sciezka}#sekcja-szkola`} className="font-medium text-green-800 underline">
          {wies.name} → Szkoła
        </Link>
        . Profil placówki:{" "}
        <Link href="/panel/soltys/spolecznosc?tryb=szkola" className="font-medium text-green-800 underline">
          Społeczność (tryb szkoły)
        </Link>
        .
      </p>

      <QrTablicaSzkolyKlient nazwaWsi={wies.name} sciezkaProfilu={sciezka} />

      <section className="panel-karta">
        <h2 className="font-serif text-lg text-green-950">
          {edytowanyId ? "Edycja ogłoszenia" : "Nowe ogłoszenie na tablicy"}
        </h2>
        {edytowanyId ? (
          <p className="mt-1 text-xs text-stone-600">
            Ważność: zostaw 0 dni, aby nie zmieniać terminu — lub podaj nową liczbę dni od dziś.
            <button type="button" className="ml-2 font-medium text-sky-800 underline" onClick={anulujEdycje}>
              Anuluj edycję
            </button>
          </p>
        ) : null}
        <p className="mt-1 text-xs text-stone-500">Szybkie szablony:</p>
        <div className="mt-2 flex flex-wrap gap-2 max-sm:[&_button]:min-h-[40px]">
          {SZABLONY_OGLOSZEN_SZKOLY.map((s, i) => (
            <button
              key={s.etykieta}
              type="button"
              className="rounded-lg border border-stone-300 bg-white px-2 py-1 text-xs font-medium hover:bg-stone-50"
              onClick={() => zastosujSzablon(i)}
            >
              {s.etykieta}
            </button>
          ))}
        </div>
        <form ref={formRef} onSubmit={wyslij} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2 block text-sm">
            <span className="font-medium">Tytuł</span>
            <input name="title" required className="form-control mt-1" maxLength={200} />
          </label>
          <label className="sm:col-span-2 block text-sm">
            <span className="font-medium">Treść</span>
            <textarea name="body" rows={4} className="form-control form-control--textarea mt-1" maxLength={8000} />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Dla kogo</span>
            <select name="audience" className="form-control mt-1" defaultValue="ogolne">
              {AUDIENCJE_OGLOSZEN_SZKOLY.map((a) => (
                <option key={a} value={a}>
                  {ETYKIETY_AUDIENCJI_SZKOLY[a]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Klasa (gdy „Konkretna klasa”)</span>
            <input name="class_label" className="form-control mt-1" placeholder="np. 5a" maxLength={32} />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Ważne przez (dni)</span>
            <input
              name="valid_until_days"
              type="number"
              min={0}
              max={365}
              defaultValue={14}
              className="form-control mt-1"
            />
            {edytowanyId ? (
              <span className="mt-0.5 block text-[10px] text-stone-500">0 = bez zmiany terminu</span>
            ) : null}
          </label>
          <label className="block text-sm">
            <span className="font-medium">Placówka (opcj.)</span>
            <select name="school_group_id" className="form-control mt-1" defaultValue="">
              <option value="">— dowolna —</option>
              {grupy.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2 block text-sm">
            <span className="font-medium">Link do PDF (opcj.)</span>
            <input name="attachment_url" type="url" className="form-control mt-1" placeholder="https://…" />
          </label>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="is_pinned" className="accent-green-800" />
            Przypnij na górze tablicy
          </label>
          {blad ? <p className="text-sm text-red-700 sm:col-span-2">{blad}</p> : null}
          {komunikat === "zapisano" ? (
            <p className="text-sm text-green-800 sm:col-span-2">Zapisano zmiany.</p>
          ) : null}
          {komunikat === "dodano" ? (
            <p className="text-sm text-green-800 sm:col-span-2">Dodano ogłoszenie.</p>
          ) : null}
          <button
            type="submit"
            disabled={czek}
            className="rounded-xl bg-green-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-900 disabled:opacity-60 sm:col-span-2 sm:w-fit"
          >
            {czek ? "Zapisywanie…" : edytowanyId ? "Zapisz zmiany" : "Opublikuj na tablicy"}
          </button>
        </form>
      </section>

      <section className="panel-karta">
        <h2 className="font-serif text-lg text-green-950">Ogłoszenia ({ogloszenia.length})</h2>
        {ogloszenia.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Brak ogłoszeń — dodaj pierwsze powyżej.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {ogloszenia.map((o) => (
              <li
                key={o.id}
                className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between ${
                  o.wygasle ? "border-amber-200 bg-amber-50/40" : "border-stone-200"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-stone-900">
                    {o.is_pinned ? "📌 " : ""}
                    {o.wygasle ? "⏱ " : ""}
                    {o.title}
                  </p>
                  {o.body ? <p className="mt-1 line-clamp-2 text-xs text-stone-600">{o.body}</p> : null}
                  <p className="mt-1 text-xs text-stone-500">
                    {ETYKIETY_AUDIENCJI_SZKOLY[o.audience]}
                    {o.class_label ? ` · ${o.class_label}` : ""} ·{" "}
                    {new Date(o.published_at).toLocaleDateString("pl-PL")}
                    {o.valid_until ? ` · do ${new Date(o.valid_until).toLocaleDateString("pl-PL")}` : ""}
                    {o.wygasle ? " · wygasło" : ""}
                  </p>
                </div>
                <span className="flex shrink-0 flex-wrap gap-x-3 gap-y-1 sm:flex-col sm:gap-1">
                  <button
                    type="button"
                    onClick={() => rozpocznijEdycje(o)}
                    className="min-h-[44px] text-xs font-medium text-stone-800 underline sm:min-h-0"
                    disabled={czek}
                  >
                    Edytuj
                  </button>
                  {o.wygasle ? (
                    <button
                      type="button"
                      onClick={() => przedluz(o.id)}
                      className="min-h-[44px] text-xs font-medium text-amber-900 underline sm:min-h-0"
                      disabled={czek}
                    >
                      Przedłuż 14 dni
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => kopiujLinkOgloszenia(o.id)}
                    className="min-h-[44px] text-xs font-medium text-sky-800 underline sm:min-h-0"
                  >
                    Kopiuj link
                  </button>
                  <button
                    type="button"
                    onClick={() => przypnij(o.id, o.is_pinned)}
                    className="min-h-[44px] text-xs font-medium text-sky-800 underline sm:min-h-0"
                    disabled={czek}
                  >
                    {o.is_pinned ? "Odepnij" : "Przypnij"}
                  </button>
                  <button
                    type="button"
                    onClick={() => usun(o.id)}
                    className="min-h-[44px] text-xs text-red-700 underline sm:min-h-0"
                    disabled={czek}
                  >
                    Usuń
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel-karta">
        <h2 className="font-serif text-lg text-green-950">RSS i widget</h2>
        <p className="mt-1 text-sm text-stone-600">
          Kanał RSS dla rodziców (czytnik wiadomości, strona szkoły):{" "}
          <a href={urlRssTablicySzkoly(wies.id)} className="break-all font-mono text-xs text-green-800 underline" target="_blank" rel="noopener noreferrer">
            {urlRssTablicySzkoly(wies.id)}
          </a>
        </p>
        <div className="mt-4">
          <KodyEmbedWsiKlient villageId={wies.id} />
        </div>
      </section>
    </div>
  );
}
