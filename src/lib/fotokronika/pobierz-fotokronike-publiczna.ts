import type { SupabaseClient } from "@supabase/supabase-js";

export type ZdjeciePubliczne = {
  id: string;
  url: string;
  caption: string | null;
  takenAt: string | null;
  createdAt: string;
  albumId: string | null;
};

export type AlbumPublicznyFotokroniki = {
  id: string;
  title: string;
  description: string | null;
  eventDate: string | null;
  tags: string[];
  zdjecia: ZdjeciePubliczne[];
};

export type FotokronikaPublicznaPelna = {
  zdjecia: ZdjeciePubliczne[];
  albumy: AlbumPublicznyFotokroniki[];
};

const PRIORYTET_ALBUMOW = ["dożynki", "dozynki", "osp", "archiwum", "straż", "straz"];

function priorytetAlbumu(title: string, tags: string[]): number {
  const tekst = `${title} ${tags.join(" ")}`.toLowerCase();
  for (let i = 0; i < PRIORYTET_ALBUMOW.length; i++) {
    if (tekst.includes(PRIORYTET_ALBUMOW[i]!)) return i;
  }
  return 99;
}

export async function pobierzFotokronikePublicznaWsi(
  supabase: SupabaseClient,
  villageId: string,
  limit = 48,
): Promise<ZdjeciePubliczne[]> {
  const pelna = await pobierzFotokronikePublicznaPelna(supabase, villageId, limit);
  return pelna.zdjecia;
}

export async function pobierzFotokronikePublicznaPelna(
  supabase: SupabaseClient,
  villageId: string,
  limit = 48,
): Promise<FotokronikaPublicznaPelna> {
  const [{ data: albumyRaw }, { data: zdjeciaRaw }] = await Promise.all([
    supabase
      .from("photo_albums")
      .select("id, title, description, event_date, tags")
      .eq("village_id", villageId)
      .eq("visibility", "public")
      .order("event_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("photos")
      .select("id, url, caption, taken_at, created_at, album_id")
      .eq("village_id", villageId)
      .eq("status", "approved")
      .eq("visibility", "public")
      .is("contest_id", null)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const zdjecia: ZdjeciePubliczne[] = (zdjeciaRaw ?? []).map((p) => ({
    id: p.id as string,
    url: p.url as string,
    caption: (p.caption as string | null) ?? null,
    takenAt: (p.taken_at as string | null) ?? null,
    createdAt: p.created_at as string,
    albumId: (p.album_id as string | null) ?? null,
  }));

  const poAlbumie = new Map<string, ZdjeciePubliczne[]>();
  const bezAlbumu: ZdjeciePubliczne[] = [];

  for (const z of zdjecia) {
    if (z.albumId) {
      const lista = poAlbumie.get(z.albumId) ?? [];
      lista.push(z);
      poAlbumie.set(z.albumId, lista);
    } else {
      bezAlbumu.push(z);
    }
  }

  const albumy: AlbumPublicznyFotokroniki[] = (albumyRaw ?? [])
    .map((a) => ({
      id: a.id as string,
      title: a.title as string,
      description: (a.description as string | null) ?? null,
      eventDate: (a.event_date as string | null) ?? null,
      tags: (a.tags as string[] | null) ?? [],
      zdjecia: poAlbumie.get(a.id as string) ?? [],
    }))
    .filter((a) => a.zdjecia.length > 0)
    .sort((a, b) => {
      const pa = priorytetAlbumu(a.title, a.tags);
      const pb = priorytetAlbumu(b.title, b.tags);
      if (pa !== pb) return pa - pb;
      return (b.eventDate ?? "").localeCompare(a.eventDate ?? "");
    });

  if (bezAlbumu.length > 0) {
    albumy.push({
      id: "__inne__",
      title: "Inne zdjęcia",
      description: null,
      eventDate: null,
      tags: [],
      zdjecia: bezAlbumu,
    });
  }

  return { zdjecia, albumy };
}
