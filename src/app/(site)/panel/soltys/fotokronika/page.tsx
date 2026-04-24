import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache } from "@/lib/panel/rola-panelu-soltysa";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pojedynczaWies } from "@/lib/supabase/wies-z-zapytania";
import { FotokronikaSoltysKlient } from "./fotokronika-soltys-klient";

export const metadata: Metadata = {
  title: "Fotokronika (sołtys)",
};

type AlbumWiersz = {
  id: string;
  title: string;
  wies_nazwa: string;
  event_date: string | null;
  visibility: string;
  opis: string | null;
  zdjZatw: { id: string; url: string; caption: string | null }[];
};

export default async function SoltysFotokronikaPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/logowanie?next=/panel/soltys/fotokronika");
  }

  const villageIds = await pobierzVillageIdsRoliPaneluSoltysaDlaUzytkownikaCache(user.id);

  const wies: { id: string; name: string }[] = [];
  if (villageIds.length > 0) {
    const { data: vs } = await supabase.from("villages").select("id, name").in("id", villageIds);
    for (const v of vs ?? []) {
      wies.push({ id: v.id, name: v.name });
    }
  }

  let oczekujace: {
    id: string;
    url: string;
    caption: string | null;
    village_id: string;
    created_at: string;
    album_id: string | null;
    wies_nazwa: string;
    album_tytul: string | null;
    zglaszajacy: string;
  }[] = [];
  if (villageIds.length > 0) {
    const { data: zdjOcz } = await supabase
      .from("photos")
      .select("id, url, caption, village_id, created_at, album_id, villages(name), photo_albums(title), users!photos_uploaded_by_fkey(display_name)")
      .in("village_id", villageIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    oczekujace = (zdjOcz ?? []).map((r) => {
      const wn = pojedynczaWies<{ name: string }>(r.villages);
      const u0 = r.users as { display_name: string } | { display_name: string }[] | null;
      const u = Array.isArray(u0) ? u0[0] : u0;
      const a0 = r.photo_albums as { title: string } | { title: string }[] | null;
      const al = Array.isArray(a0) ? a0[0] : a0;
      return {
        id: r.id,
        url: r.url,
        caption: r.caption,
        village_id: r.village_id,
        created_at: r.created_at,
        album_id: r.album_id,
        wies_nazwa: wn?.name ?? "—",
        album_tytul: al?.title ?? null,
        zglaszajacy: u?.display_name?.trim() || "Użytkownik",
      };
    });
  }

  let albumy: AlbumWiersz[] = [];
  const okladki: Record<string, string | null> = {};
  if (villageIds.length > 0) {
    const { data: alRows } = await supabase
      .from("photo_albums")
      .select("id, title, description, event_date, visibility, village_id, cover_photo_id, villages(name)")
      .in("village_id", villageIds)
      .order("event_date", { ascending: false, nullsFirst: false });
    const idsAlb = (alRows ?? []).map((a) => a.id);
    let poZatw: { id: string; url: string; caption: string | null; album_id: string | null }[] = [];
    if (idsAlb.length > 0) {
      const { data: pht } = await supabase
        .from("photos")
        .select("id, url, caption, album_id")
        .in("album_id", idsAlb)
        .eq("status", "approved");
      poZatw = (pht ?? []) as typeof poZatw;
    }
    const wGrup = new Map<string, { id: string; url: string; caption: string | null }[]>();
    for (const p of poZatw) {
      if (!p.album_id) continue;
      const l = wGrup.get(p.album_id) ?? [];
      l.push({ id: p.id, url: p.url, caption: p.caption });
      wGrup.set(p.album_id, l);
    }
    for (const a of alRows ?? []) {
      okladki[a.id] = a.cover_photo_id;
      const wn = pojedynczaWies<{ name: string }>(a.villages);
      albumy.push({
        id: a.id,
        title: a.title,
        wies_nazwa: wn?.name ?? "—",
        event_date: a.event_date,
        visibility: a.visibility,
        opis: a.description,
        zdjZatw: wGrup.get(a.id) ?? [],
      });
    }
  }

  return (
    <main>
      <p className="mb-4 text-sm text-stone-500">
        <Link href="/panel/soltys" className="text-green-800 underline">
          ← Panel sołtysa
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-green-950">Fotokronika wsi</h1>
      <p className="mt-2 max-w-2xl text-sm text-stone-600">
        Twórz albumy, zatwierdzaj lub odrzucaj zdjęcia od mieszkańców. Oni wysyłają pliki w{" "}
        <Link href="/panel/mieszkaniec/fotokronika" className="text-green-800 underline">
          panelu mieszkańca
        </Link>
        .
      </p>
      {villageIds.length === 0 ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Brak przypisanej wsi w roli sołtysa (lub współadmina). Po aktywacji roli wróć tutaj.
        </p>
      ) : (
        <FotokronikaSoltysKlient
          wies={wies}
          oczekujace={oczekujace}
          albumy={albumy}
          okladki={okladki}
        />
      )}
    </main>
  );
}
