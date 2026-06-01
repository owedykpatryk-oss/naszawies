import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AudiencjaOgloszeniaSzkoly,
  OgloszenieSzkolyPanel,
  OgloszenieSzkolyPubliczne,
} from "@/lib/szkola/teksty-szkoly";

function mapujWiersz(r: Record<string, unknown>): OgloszenieSzkolyPubliczne {
  const validUntil = (r.valid_until as string | null) ?? null;
  return {
    id: r.id as string,
    title: r.title as string,
    body: (r.body as string | null) ?? null,
    audience: r.audience as AudiencjaOgloszeniaSzkoly,
    class_label: (r.class_label as string | null) ?? null,
    is_pinned: Boolean(r.is_pinned),
    attachment_url: (r.attachment_url as string | null) ?? null,
    valid_until: validUntil,
    published_at: (r.published_at as string) ?? new Date().toISOString(),
  };
}

export async function pobierzOgloszeniaSzkolyPubliczne(
  supabase: SupabaseClient,
  villageId: string,
  limit = 40,
): Promise<OgloszenieSzkolyPubliczne[]> {
  const { data, error } = await supabase
    .from("school_announcements")
    .select(
      "id, title, body, audience, class_label, is_pinned, attachment_url, valid_until, published_at",
    )
    .eq("village_id", villageId)
    .eq("status", "approved")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[pobierzOgloszeniaSzkoly]", error.message);
    return [];
  }

  const teraz = Date.now();
  return (data ?? [])
    .map((r) => mapujWiersz(r as Record<string, unknown>))
    .filter((o) => !o.valid_until || new Date(o.valid_until).getTime() > teraz);
}

/** Panel sołtysa — wszystkie ogłoszenia, także po terminie ważności. */
export async function pobierzOgloszeniaSzkolyDlaPanelu(
  supabase: SupabaseClient,
  villageId: string,
  limit = 80,
): Promise<OgloszenieSzkolyPanel[]> {
  const { data, error } = await supabase
    .from("school_announcements")
    .select(
      "id, title, body, audience, class_label, is_pinned, attachment_url, valid_until, published_at, school_group_id",
    )
    .eq("village_id", villageId)
    .eq("status", "approved")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[pobierzOgloszeniaSzkolyDlaPanelu]", error.message);
    return [];
  }

  const teraz = Date.now();
  return (data ?? []).map((r) => {
    const base = mapujWiersz(r as Record<string, unknown>);
    const wygasle = Boolean(base.valid_until && new Date(base.valid_until).getTime() <= teraz);
    return {
      ...base,
      wygasle,
      school_group_id: (r.school_group_id as string | null) ?? null,
    };
  });
}

export function filtrujOgloszeniaSzkolyDlaAudiencji(
  lista: OgloszenieSzkolyPubliczne[],
  filtr: AudiencjaOgloszeniaSzkoly | "wszystkie",
  klasa?: string,
): OgloszenieSzkolyPubliczne[] {
  if (filtr === "wszystkie") return lista;
  return lista.filter((o) => {
    if (o.audience === "ogolne") return true;
    if (filtr === "klasa" && o.audience === "klasa") {
      if (!klasa?.trim()) return true;
      return (o.class_label ?? "").toLowerCase() === klasa.trim().toLowerCase();
    }
    return o.audience === filtr;
  });
}
