import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WiesPubliczna } from "@/lib/wies/znajdz-wies-po-sciezce";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";

type Hit = { klucz: string; typ: string; tytul: string; href: string; meta: string };

function fragmentBezpieczny(q: string): string {
  return q.replace(/[%_\\]/g, "").trim().slice(0, 120);
}

export async function WiesSzukajTresci({
  supabase,
  wies,
  qSurowe,
}: {
  supabase: SupabaseClient;
  wies: WiesPubliczna;
  qSurowe: string;
}) {
  const sciezka = sciezkaProfiluWsi(wies);
  const fragment = fragmentBezpieczny(qSurowe);

  if (!fragment) {
    return (
      <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
        <p className="mb-4 text-sm text-stone-500">
          <Link href={sciezka} className="text-green-800 underline">
            ← {wies.name}
          </Link>
        </p>
        <h1 className="font-serif text-2xl text-green-950">Szukaj na stronie wsi</h1>
        <p className="mt-2 text-sm text-stone-600">
          Przeszukujemy ogłoszenia, blog, historię, rynek, wiadomości, dotacje i zapowiedzi wydarzeń — tylko treści
          publiczne dla tej miejscowości.
        </p>
        <form method="get" className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm font-medium text-stone-800">
            Fraza
            <input
              name="q"
              type="search"
              className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
              placeholder="np. remont, festyn, dotacja"
              maxLength={160}
              autoComplete="off"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-green-900 px-4 py-2 text-sm text-white hover:bg-green-950"
          >
            Szukaj
          </button>
        </form>
      </main>
    );
  }

  const wzor = `%${fragment}%`;
  const vid = wies.id;

  const [posty, blog, hist, rynek, news, dotacje, wyd] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, created_at")
      .eq("village_id", vid)
      .eq("status", "approved")
      .ilike("title", wzor)
      .limit(10),
    supabase
      .from("village_blog_posts")
      .select("id, title, published_at, created_at")
      .eq("village_id", vid)
      .eq("status", "approved")
      .ilike("title", wzor)
      .limit(10),
    supabase
      .from("village_history_entries")
      .select("id, title, created_at")
      .eq("village_id", vid)
      .eq("status", "approved")
      .ilike("title", wzor)
      .limit(10),
    supabase
      .from("marketplace_listings")
      .select("id, title, listing_type, published_at, created_at")
      .eq("village_id", vid)
      .eq("status", "approved")
      .ilike("title", wzor)
      .limit(10),
    supabase
      .from("local_news_items")
      .select("id, title, published_at, created_at")
      .eq("village_id", vid)
      .eq("status", "approved")
      .ilike("title", wzor)
      .limit(10),
    supabase
      .from("village_funding_sources")
      .select("id, title, application_deadline")
      .eq("village_id", vid)
      .eq("status", "approved")
      .ilike("title", wzor)
      .limit(10),
    supabase
      .from("village_community_events")
      .select("id, title, starts_at")
      .eq("village_id", vid)
      .eq("status", "approved")
      .ilike("title", wzor)
      .limit(10),
  ]);

  const trafienia: Hit[] = [];

  for (const r of posty.data ?? []) {
    trafienia.push({
      klucz: `p-${r.id}`,
      typ: "Ogłoszenie",
      tytul: r.title,
      href: `${sciezka}/ogloszenie/${r.id}`,
      meta: new Date(r.created_at).toLocaleDateString("pl-PL"),
    });
  }
  for (const r of blog.data ?? []) {
    trafienia.push({
      klucz: `b-${r.id}`,
      typ: "Blog",
      tytul: r.title,
      href: `${sciezka}/blog/${r.id}`,
      meta: new Date(r.published_at ?? r.created_at).toLocaleDateString("pl-PL"),
    });
  }
  for (const r of hist.data ?? []) {
    trafienia.push({
      klucz: `h-${r.id}`,
      typ: "Historia",
      tytul: r.title,
      href: `${sciezka}/historia/${r.id}`,
      meta: new Date(r.created_at).toLocaleDateString("pl-PL"),
    });
  }
  for (const r of rynek.data ?? []) {
    trafienia.push({
      klucz: `m-${r.id}`,
      typ: "Rynek lokalny",
      tytul: r.title,
      href: `${sciezka}#sekcja-rynek-lokalny`,
      meta: `${r.listing_type} · ${new Date(r.published_at ?? r.created_at).toLocaleDateString("pl-PL")}`,
    });
  }
  for (const r of news.data ?? []) {
    trafienia.push({
      klucz: `n-${r.id}`,
      typ: "Wiadomość lokalna",
      tytul: r.title,
      href: `${sciezka}#sekcja-wiadomosci-lokalne`,
      meta: new Date(r.published_at ?? r.created_at).toLocaleDateString("pl-PL"),
    });
  }
  for (const r of dotacje.data ?? []) {
    trafienia.push({
      klucz: `d-${r.id}`,
      typ: "Dotacja / grant",
      tytul: r.title,
      href: `${sciezka}/dotacje/${r.id}`,
      meta: r.application_deadline
        ? `Nabór do ${new Date(r.application_deadline).toLocaleDateString("pl-PL")}`
        : "Termin naboru — sprawdź wpis",
    });
  }
  for (const r of wyd.data ?? []) {
    trafienia.push({
      klucz: `e-${r.id}`,
      typ: "Wydarzenie",
      tytul: r.title,
      href: `${sciezka}/wydarzenia/${r.id}`,
      meta: new Date(r.starts_at).toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" }),
    });
  }

  return (
    <main className="mx-auto min-w-0 max-w-2xl py-16 text-stone-800">
      <p className="mb-4 text-sm text-stone-500">
        <Link href={sciezka} className="text-green-800 underline">
          ← {wies.name}
        </Link>
      </p>
      <h1 className="font-serif text-2xl text-green-950">Wyniki: „{fragment}”</h1>
      <form method="get" className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="block flex-1 text-sm font-medium text-stone-800">
          Nowa fraza
          <input
            name="q"
            type="search"
            defaultValue={fragment}
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
            maxLength={160}
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-green-900 px-4 py-2 text-sm text-white hover:bg-green-950"
        >
          Szukaj
        </button>
      </form>

      {trafienia.length === 0 ? (
        <p className="mt-8 text-sm text-stone-600">Brak dopasowań w publicznych modułach tej wsi.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {trafienia.map((t) => (
            <li key={t.klucz}>
              <Link
                href={t.href}
                className="block rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition hover:border-green-300 hover:bg-green-50/40"
              >
                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{t.typ}</p>
                <p className="mt-1 font-medium text-stone-900">{t.tytul}</p>
                <p className="mt-1 text-xs text-stone-500">{t.meta}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
