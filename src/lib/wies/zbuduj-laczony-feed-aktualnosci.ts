import { etykietaRodzajuWydarzenia } from "@/lib/wies/teksty-organizacji";

export type ElementLaczonegoFeedu = {
  sortAt: number;
  etykieta: string;
  tytul: string;
  href: string;
  podpis: string;
};

type PostSkrot = { id: string; title: string; type: string; created_at: string };
type BlogSkrot = {
  id: string;
  title: string;
  excerpt: string | null;
  published_at: string | null;
  created_at: string;
};
type HistoriaSkrot = {
  id: string;
  title: string;
  short_description: string | null;
  event_date: string | null;
  created_at: string;
};
type WiadSkrot = {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  source_name: string | null;
  source_url: string | null;
  published_at: string | null;
  created_at: string;
};
type WydSkrot = {
  id: string;
  event_kind: string;
  title: string;
  starts_at: string;
  nazwa_grupy: string | null;
};

type RynekSkrot = {
  id: string;
  title: string;
  listing_type: string;
  published_at: string | null;
  created_at: string;
};

function formatPl(ts: number) {
  return new Date(ts).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
}

/** Chronologicznie (najnowsze pierwsze) — skrót z kilku modułów publicznego profilu wsi. */
export function zbudujLaczonyFeedAktualnosci(
  sciezka: string,
  posty: PostSkrot[],
  blog: BlogSkrot[],
  historia: HistoriaSkrot[],
  wiadomosci: WiadSkrot[],
  wydarzenia: WydSkrot[],
  rynek: RynekSkrot[] = [],
  villageId?: string,
  limit = 14,
): ElementLaczonegoFeedu[] {
  const out: ElementLaczonegoFeedu[] = [];

  for (const p of posty) {
    const t = Date.parse(p.created_at);
    if (!Number.isFinite(t)) continue;
    out.push({
      sortAt: t,
      etykieta: "Ogłoszenie",
      tytul: p.title,
      href: `${sciezka}/ogloszenie/${p.id}`,
      podpis: `${p.type} · ${formatPl(t)}`,
    });
  }

  for (const w of blog) {
    const raw = w.published_at ?? w.created_at;
    const t = Date.parse(raw);
    if (!Number.isFinite(t)) continue;
    out.push({
      sortAt: t,
      etykieta: "Blog",
      tytul: w.title,
      href: `${sciezka}/blog/${w.id}`,
      podpis: formatPl(t),
    });
  }

  for (const w of historia) {
    const raw = w.event_date ?? w.created_at;
    const t = Date.parse(raw);
    if (!Number.isFinite(t)) continue;
    out.push({
      sortAt: t,
      etykieta: "Historia wsi",
      tytul: w.title,
      href: `${sciezka}/historia/${w.id}`,
      podpis: formatPl(t),
    });
  }

  for (const w of wiadomosci) {
    const raw = w.published_at ?? w.created_at;
    const t = Date.parse(raw);
    if (!Number.isFinite(t)) continue;
    const zrodlo = w.source_name ? `Źródło: ${w.source_name}` : "";
    const kat = w.category ?? "aktualność";
    const hrefZewnetrzny =
      w.source_url?.trim().startsWith("http") ? w.source_url.trim() : `${sciezka}#wiadomosc-lokalna-${w.id}`;
    out.push({
      sortAt: t,
      etykieta: "Wiadomość lokalna",
      tytul: w.title,
      href: hrefZewnetrzny,
      podpis: [kat, zrodlo, formatPl(t)].filter(Boolean).join(" · "),
    });
  }

  for (const ev of wydarzenia) {
    const t = Date.parse(ev.starts_at);
    if (!Number.isFinite(t)) continue;
    out.push({
      sortAt: t,
      etykieta: "Wydarzenie",
      tytul: ev.title,
      href: `${sciezka}/wydarzenia/${ev.id}`,
      podpis: [
        etykietaRodzajuWydarzenia(ev.event_kind),
        ev.nazwa_grupy ?? "",
        formatPl(t),
      ]
        .filter(Boolean)
        .join(" · "),
    });
  }

  for (const r of rynek) {
    const raw = r.published_at ?? r.created_at;
    const t = Date.parse(raw);
    if (!Number.isFinite(t)) continue;
    out.push({
      sortAt: t,
      etykieta: "Rynek",
      tytul: r.title,
      href: `${sciezka}#sekcja-rynek-lokalny`,
      podpis: [r.listing_type, formatPl(t)].filter(Boolean).join(" · "),
    });
  }

  return out.sort((a, b) => b.sortAt - a.sortAt).slice(0, limit);
}
