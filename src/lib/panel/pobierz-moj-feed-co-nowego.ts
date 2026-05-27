import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { etykietaRodzajuWydarzenia } from "@/lib/wies/teksty-organizacji";
import type { ElementLaczonegoFeedu } from "@/lib/wies/zbuduj-laczony-feed-aktualnosci";

export type MojeElementFeedu = ElementLaczonegoFeedu & {
  nazwaWsi: string;
  villageId: string;
};

type WiesSkrot = {
  id: string;
  name: string;
  slug: string;
  voivodeship: string;
  county: string;
  commune: string;
};

function formatPl(ts: number) {
  return new Date(ts).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
}

function nazwaPowiazanejGrupy(rel: { name: string } | { name: string }[] | null | undefined): string | null {
  if (rel == null) return null;
  if (Array.isArray(rel)) return rel[0]?.name ?? null;
  return rel.name ?? null;
}

/** Osobisty feed chronologiczny z wielu wsi (role, obserwacje, obserwowane gminy). */
export async function pobierzMojFeedCoNowego(villageIds: string[], limit = 24): Promise<MojeElementFeedu[]> {
  if (villageIds.length === 0) return [];

  const supabase = utworzKlientaSupabaseSerwer();
  const unikalne = Array.from(new Set(villageIds));

  const { data: wsieRaw } = await supabase
    .from("villages")
    .select("id, name, slug, voivodeship, county, commune")
    .in("id", unikalne);

  const mapaWsi = new Map<string, WiesSkrot>();
  for (const v of (wsieRaw ?? []) as WiesSkrot[]) {
    mapaWsi.set(v.id, v);
  }

  const odWydarzen = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: postyRaw },
    { data: blogRaw },
    { data: wiadomosciRaw },
    { data: wydRaw },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select("id, title, type, created_at, village_id")
      .in("village_id", unikalne)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(Math.min(40, limit * 2)),
    supabase
      .from("village_blog_posts")
      .select("id, title, published_at, created_at, village_id")
      .in("village_id", unikalne)
      .eq("status", "approved")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(20),
    supabase
      .from("local_news_items")
      .select("id, title, category, source_name, published_at, created_at, village_id")
      .in("village_id", unikalne)
      .eq("status", "approved")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(20),
    supabase
      .from("village_community_events")
      .select("id, title, event_kind, starts_at, village_id, village_community_groups(name)")
      .in("village_id", unikalne)
      .eq("status", "approved")
      .gte("starts_at", odWydarzen)
      .order("starts_at", { ascending: true })
      .limit(24),
  ]);

  const out: MojeElementFeedu[] = [];

  for (const p of postyRaw ?? []) {
    const t = Date.parse(p.created_at);
    if (!Number.isFinite(t)) continue;
    const w = mapaWsi.get(p.village_id);
    if (!w) continue;
    const sciezka = sciezkaProfiluWsi(w);
    out.push({
      sortAt: t,
      etykieta: "Ogłoszenie",
      tytul: p.title,
      href: `${sciezka}/ogloszenie/${p.id}`,
      podpis: `${w.name} · ${p.type} · ${formatPl(t)}`,
      nazwaWsi: w.name,
      villageId: p.village_id,
    });
  }

  for (const w of blogRaw ?? []) {
    const raw = w.published_at ?? w.created_at;
    const t = Date.parse(raw);
    if (!Number.isFinite(t)) continue;
    const v = mapaWsi.get(w.village_id);
    if (!v) continue;
    const sciezka = sciezkaProfiluWsi(v);
    out.push({
      sortAt: t,
      etykieta: "Blog",
      tytul: w.title,
      href: `${sciezka}/blog/${w.id}`,
      podpis: `${v.name} · ${formatPl(t)}`,
      nazwaWsi: v.name,
      villageId: w.village_id,
    });
  }

  for (const w of wiadomosciRaw ?? []) {
    const raw = w.published_at ?? w.created_at;
    const t = Date.parse(raw);
    if (!Number.isFinite(t)) continue;
    const v = mapaWsi.get(w.village_id);
    if (!v) continue;
    const sciezka = sciezkaProfiluWsi(v);
    const kat = w.category ?? "aktualność";
    out.push({
      sortAt: t,
      etykieta: "Wiadomość",
      tytul: w.title,
      href: `${sciezka}#wiadomosc-lokalna-${w.id}`,
      podpis: `${v.name} · ${kat}${w.source_name ? ` · ${w.source_name}` : ""} · ${formatPl(t)}`,
      nazwaWsi: v.name,
      villageId: w.village_id,
    });
  }

  type WydRaw = {
    id: string;
    title: string;
    event_kind: string;
    starts_at: string;
    village_id: string;
    village_community_groups: { name: string } | { name: string }[] | null;
  };

  for (const ev of (wydRaw ?? []) as unknown as WydRaw[]) {
    const t = Date.parse(ev.starts_at);
    if (!Number.isFinite(t)) continue;
    const v = mapaWsi.get(ev.village_id);
    if (!v) continue;
    const sciezka = sciezkaProfiluWsi(v);
    const ng = nazwaPowiazanejGrupy(ev.village_community_groups);
    out.push({
      sortAt: t,
      etykieta: "Wydarzenie",
      tytul: ev.title,
      href: `${sciezka}/wydarzenia/${ev.id}`,
      podpis: [v.name, etykietaRodzajuWydarzenia(ev.event_kind), ng ?? "", formatPl(t)].filter(Boolean).join(" · "),
      nazwaWsi: v.name,
      villageId: ev.village_id,
    });
  }

  return out.sort((a, b) => b.sortAt - a.sortAt).slice(0, limit);
}
