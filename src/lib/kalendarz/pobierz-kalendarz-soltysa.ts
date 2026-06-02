import type { SupabaseClient } from "@supabase/supabase-js";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { ETYKIETA_RODZAJU_KALENDARZA } from "@/lib/lowiectwo/kalendarz-lowiecki";
import type { RodzajWpisuKalendarzaLowieckiego } from "@/lib/lowiectwo/kalendarz-lowiecki";
import { rozwinHarmonogramTygodniowy } from "./rozwin-harmonogram";
import type { WpisKalendarza } from "./typy-kalendarza";

export type KontekstKalendarzaSoltysa = {
  wpisy: WpisKalendarza[];
  nazwyWsi: Record<string, string>;
  hrefWsi: Record<string, string>;
  gminaLabel: string | null;
  od: string;
  do: string;
};

export async function pobierzKalendarzSoltysa(
  supabase: SupabaseClient,
  villageIds: string[],
  od: Date,
  doDaty: Date,
): Promise<KontekstKalendarzaSoltysa> {
  const wpisy: WpisKalendarza[] = [];
  const nazwyWsi: Record<string, string> = {};
  const hrefWsi: Record<string, string> = {};
  let gminaLabel: string | null = null;

  if (villageIds.length === 0) {
    return { wpisy, nazwyWsi, hrefWsi, gminaLabel, od: od.toISOString(), do: doDaty.toISOString() };
  }

  const { data: wsie } = await supabase
    .from("villages")
    .select("id, name, voivodeship, county, commune, slug")
    .in("id", villageIds);

  let woj = "";
  let powiat = "";
  let gmina = "";
  for (const v of wsie ?? []) {
    nazwyWsi[v.id] = v.name;
    hrefWsi[v.id] = sciezkaProfiluWsi({
      voivodeship: v.voivodeship,
      county: v.county,
      commune: v.commune,
      slug: v.slug,
    });
    woj = v.voivodeship;
    powiat = v.county;
    gmina = v.commune;
  }
  if (gmina) gminaLabel = `Gmina ${gmina}`;

  const odIso = od.toISOString();
  const doIso = doDaty.toISOString();

  const { data: sale } = await supabase.from("halls").select("id, name, village_id").in("village_id", villageIds);
  const hallIds = (sale ?? []).map((h) => h.id as string);

  const [
    { data: wydarzenia },
    { data: rezerwacje },
    { data: sloty },
    { data: dotacje },
    { data: konkursy },
    { data: zadania },
    { data: posty },
    { data: lowiectwo },
    { data: harmonogramLow },
  ] = await Promise.all([
    supabase
      .from("village_community_events")
      .select("id, village_id, title, description, location_text, starts_at, ends_at, event_kind, status")
      .in("village_id", villageIds)
      .eq("status", "approved")
      .gte("starts_at", odIso)
      .lte("starts_at", doIso)
      .order("starts_at", { ascending: true }),
    hallIds.length > 0
      ? supabase
          .from("hall_bookings")
          .select("id, hall_id, start_at, end_at, event_type, event_title, status")
          .in("hall_id", hallIds)
          .in("status", ["pending", "approved"])
          .gte("start_at", odIso)
          .lte("start_at", doIso)
          .order("start_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    supabase
      .from("village_weekly_schedule_slots")
      .select(
        "id, village_id, day_of_week, time_start, time_end, title, description, village_community_groups(name)",
      )
      .in("village_id", villageIds),
    supabase
      .from("village_funding_sources")
      .select("id, village_id, title, application_deadline, status")
      .in("village_id", villageIds)
      .eq("status", "approved")
      .not("application_deadline", "is", null)
      .gte("application_deadline", odIso.slice(0, 10))
      .lte("application_deadline", doIso.slice(0, 10)),
    supabase
      .from("village_photo_contests")
      .select(
        "id, village_id, title, status, submissions_end, voting_start, voting_end",
      )
      .in("village_id", villageIds)
      .neq("status", "cancelled"),
    supabase
      .from("village_soltys_calendar_entries")
      .select("id, village_id, title, description, entry_kind, starts_at, ends_at, is_done")
      .in("village_id", villageIds)
      .eq("is_done", false)
      .gte("starts_at", odIso)
      .lte("starts_at", doIso)
      .order("starts_at", { ascending: true }),
    supabase
      .from("posts")
      .select("id, village_id, title, type, event_start_at, event_end_at, event_location, status")
      .in("village_id", villageIds)
      .in("type", ["wydarzenie", "zebranie"])
      .eq("status", "approved")
      .not("event_start_at", "is", null)
      .gte("event_start_at", odIso)
      .lte("event_start_at", doIso),
    supabase
      .from("village_hunting_notices")
      .select("id, village_id, title, area_description, starts_at, ends_at, status")
      .in("village_id", villageIds)
      .eq("status", "approved")
      .gte("ends_at", odIso)
      .lte("starts_at", doIso),
    supabase
      .from("village_hunting_schedule_entries")
      .select("id, village_id, entry_kind, title, starts_at, ends_at, hunter_name, stand_label, pois(name)")
      .in("village_id", villageIds)
      .gte("ends_at", odIso)
      .lte("starts_at", doIso)
      .order("starts_at", { ascending: true }),
  ]);

  const nazwaSali: Record<string, string> = {};
  const wiesSali: Record<string, string> = {};
  for (const h of sale ?? []) {
    nazwaSali[h.id] = h.name;
    wiesSali[h.id] = h.village_id as string;
  }

  for (const e of wydarzenia ?? []) {
    wpisy.push({
      id: `wydarzenie-${e.id}`,
      rodzaj: "wydarzenie",
      tytul: e.title,
      start: e.starts_at,
      end: e.ends_at,
      calodniowe: false,
      wiesId: e.village_id,
      wiesNazwa: nazwyWsi[e.village_id] ?? "—",
      opis: [e.location_text, e.description].filter(Boolean).join(" · ") || null,
      href: `${hrefWsi[e.village_id]}/wydarzenia/${e.id}`,
    });
  }

  for (const r of rezerwacje ?? []) {
    const vId = wiesSali[r.hall_id as string];
    if (!vId) continue;
    wpisy.push({
      id: `rezerwacja-${r.id}`,
      rodzaj: "rezerwacja",
      tytul: r.event_title?.trim() || `${r.event_type} — ${nazwaSali[r.hall_id] ?? "sala"}`,
      start: r.start_at,
      end: r.end_at,
      calodniowe: false,
      wiesId: vId,
      wiesNazwa: nazwyWsi[vId] ?? "—",
      href: "/panel/soltys/rezerwacje",
      status: r.status,
      pilne: r.status === "pending",
    });
  }

  const slotyMap = (sloty ?? []).map((s) => {
    const grupa = Array.isArray(s.village_community_groups)
      ? s.village_community_groups[0]
      : s.village_community_groups;
    return {
      id: s.id as string,
      village_id: s.village_id as string,
      day_of_week: s.day_of_week as number,
      time_start: String(s.time_start),
      time_end: (s.time_end as string | null) ?? null,
      title: s.title as string,
      description: (s.description as string | null) ?? null,
      nazwa_grupy: (grupa as { name?: string } | null)?.name ?? null,
    };
  });
  wpisy.push(...rozwinHarmonogramTygodniowy(slotyMap, nazwyWsi, od, doDaty));

  for (const d of dotacje ?? []) {
    const deadline = `${d.application_deadline}T12:00:00.000Z`;
    wpisy.push({
      id: `dotacja-${d.id}`,
      rodzaj: "dotacja",
      tytul: `Termin naboru: ${d.title}`,
      start: deadline,
      end: null,
      calodniowe: true,
      wiesId: d.village_id,
      wiesNazwa: nazwyWsi[d.village_id] ?? "—",
      href: `${hrefWsi[d.village_id]}/dotacje/${d.id}`,
    });
  }

  for (const k of konkursy ?? []) {
    const fazy: { label: string; at: string }[] = [
      { label: "Koniec zgłoszeń", at: k.submissions_end },
      { label: "Start głosowania", at: k.voting_start },
      { label: "Koniec głosowania", at: k.voting_end },
    ];
    for (const f of fazy) {
      const t = new Date(f.at).getTime();
      if (t < od.getTime() || t > doDaty.getTime()) continue;
      wpisy.push({
        id: `konkurs-${k.id}-${f.label}`,
        rodzaj: "konkurs",
        tytul: `${k.title} — ${f.label}`,
        start: f.at,
        end: null,
        calodniowe: false,
        wiesId: k.village_id,
        wiesNazwa: nazwyWsi[k.village_id] ?? "—",
        href: "/panel/soltys/konkursy",
        status: k.status,
      });
    }
  }

  for (const z of zadania ?? []) {
    wpisy.push({
      id: `zadanie-${z.id}`,
      rodzaj: "zadanie",
      tytul: z.title,
      start: z.starts_at,
      end: z.ends_at,
      calodniowe: !z.ends_at,
      wiesId: z.village_id,
      wiesNazwa: nazwyWsi[z.village_id] ?? "—",
      opis: z.description,
      href: "/panel/soltys/kalendarz",
      status: z.entry_kind,
    });
  }

  for (const h of lowiectwo ?? []) {
    wpisy.push({
      id: `lowiectwo-${h.id}`,
      rodzaj: "lowiectwo",
      tytul: h.title,
      start: h.starts_at,
      end: h.ends_at,
      calodniowe: false,
      wiesId: h.village_id,
      wiesNazwa: nazwyWsi[h.village_id] ?? "—",
      opis: h.area_description,
      href: "/panel/soltys/lowiectwo",
      pilne: true,
    });
  }

  for (const row of harmonogramLow ?? []) {
    const kind = row.entry_kind as RodzajWpisuKalendarzaLowieckiego;
    const pois = row.pois as { name?: string } | { name?: string }[] | null;
    const p = Array.isArray(pois) ? pois[0] : pois;
    const ambona = p?.name?.trim() || row.stand_label || null;
    const opisParts = [
      ETYKIETA_RODZAJU_KALENDARZA[kind] ?? kind,
      ambona ? `Stanowisko: ${ambona}` : null,
      row.hunter_name ? `Osoba: ${row.hunter_name}` : null,
    ].filter(Boolean);
    wpisy.push({
      id: `harm-low-${row.id}`,
      rodzaj: "harmonogram_lowiecki",
      tytul: row.title,
      start: row.starts_at,
      end: row.ends_at,
      calodniowe: false,
      wiesId: row.village_id,
      wiesNazwa: nazwyWsi[row.village_id] ?? "—",
      opis: opisParts.join(" · "),
      href: "/panel/soltys/lowiectwo/kalendarz",
      pilne: kind === "obowiazek_ambony",
    });
  }

  for (const p of posty ?? []) {
    wpisy.push({
      id: `post-${p.id}`,
      rodzaj: "ogloszenie",
      tytul: p.title,
      start: p.event_start_at as string,
      end: (p.event_end_at as string | null) ?? null,
      calodniowe: false,
      wiesId: p.village_id,
      wiesNazwa: nazwyWsi[p.village_id] ?? "—",
      opis: p.event_location,
      href: hrefWsi[p.village_id],
    });
  }

  if (woj && powiat && gmina) {
    const { data: wsieGminy } = await supabase
      .from("villages")
      .select("id, name, slug, voivodeship, county, commune")
      .eq("voivodeship", woj)
      .eq("county", powiat)
      .eq("commune", gmina)
      .eq("is_active", true);

    const idsGminy = (wsieGminy ?? [])
      .map((v) => v.id as string)
      .filter((id) => !villageIds.includes(id));

    if (idsGminy.length > 0) {
      const { data: wydGminy } = await supabase
        .from("village_community_events")
        .select("id, village_id, title, starts_at, ends_at, location_text")
        .in("village_id", idsGminy)
        .eq("status", "approved")
        .gte("starts_at", odIso)
        .lte("starts_at", doIso)
        .order("starts_at", { ascending: true })
        .limit(40);

      const nazwyGminy: Record<string, string> = {};
      const hrefGminy: Record<string, string> = {};
      for (const v of wsieGminy ?? []) {
        nazwyGminy[v.id] = v.name;
        hrefGminy[v.id] = sciezkaProfiluWsi({
          voivodeship: v.voivodeship,
          county: v.county,
          commune: v.commune,
          slug: v.slug,
        });
      }

      for (const e of wydGminy ?? []) {
        wpisy.push({
          id: `gmina-${e.id}`,
          rodzaj: "gmina",
          tytul: e.title,
          start: e.starts_at,
          end: e.ends_at,
          calodniowe: false,
          wiesId: e.village_id,
          wiesNazwa: nazwyGminy[e.village_id] ?? "—",
          opis: e.location_text,
          href: `${hrefGminy[e.village_id]}/wydarzenia/${e.id}`,
          zGminy: true,
        });
      }
    }
  }

  wpisy.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  return { wpisy, nazwyWsi, hrefWsi, gminaLabel, od: odIso, do: doIso };
}
