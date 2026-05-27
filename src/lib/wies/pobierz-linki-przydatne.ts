import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizujKategorieLinku, type LinkPrzydatnyPubliczny } from "@/lib/wies/linki-przydatne";

type WierszLinku = {
  id: string;
  category: string;
  title: string;
  url: string | null;
  phone: string | null;
  email: string | null;
  note: string | null;
  display_order: number;
};

function mapWiersz(r: WierszLinku): LinkPrzydatnyPubliczny {
  return {
    id: r.id,
    category: normalizujKategorieLinku(r.category),
    title: r.title,
    url: r.url,
    phone: r.phone,
    email: r.email,
    note: r.note,
    display_order: r.display_order,
  };
}

export async function pobierzLinkiPrzydatneWsi(
  supabase: SupabaseClient,
  villageId: string,
): Promise<LinkPrzydatnyPubliczny[]> {
  const { data } = await supabase
    .from("village_useful_links")
    .select("id, category, title, url, phone, email, note, display_order")
    .eq("village_id", villageId)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("title", { ascending: true });
  return (data ?? []).map((r) => mapWiersz(r as WierszLinku));
}

/** Na hubie gminy — unikalne linki z wszystkich wsi w gminie (pierwsze wystąpienie wygrywa). */
export async function pobierzLinkiPrzydatneDlaWsiGminy(
  supabase: SupabaseClient,
  villageIds: string[],
): Promise<LinkPrzydatnyPubliczny[]> {
  if (villageIds.length === 0) return [];
  const { data } = await supabase
    .from("village_useful_links")
    .select("id, category, title, url, phone, email, note, display_order, village_id")
    .in("village_id", villageIds)
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("title", { ascending: true });

  const widziane = new Set<string>();
  const wynik: LinkPrzydatnyPubliczny[] = [];
  for (const r of data ?? []) {
    const klucz = `${r.category}|${r.title}|${r.url ?? ""}|${r.phone ?? ""}`;
    if (widziane.has(klucz)) continue;
    widziane.add(klucz);
    wynik.push(mapWiersz(r as WierszLinku));
  }
  return wynik;
}
