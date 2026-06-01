import type { Metadata } from "next";
import { NaglowekModuluPanelu } from "@/components/pomoc/naglowek-modulu-panelu";
import { etykietaPresetu } from "@/lib/czat/grupy-preset";
import { pobierzNieprzeczytanePoKonwersacji } from "@/lib/czat/pobierz-nieprzeczytane";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { pobierzUzytkownikaPanelu } from "@/lib/auth/pobierz-uzytkownika-serwer";
import { CzatListaGrupKlient } from "./czat-lista-grup-klient";
import { CzatListaKonwersacjiKlient, type WierszKonwersacjiCzat } from "./czat-lista-konwersacji-klient";

export const metadata: Metadata = { title: "Wiadomości" };

export default async function CzatPage() {
  const supabase = utworzKlientaSupabaseSerwer();
  const user = await pobierzUzytkownikaPanelu();

  const { data: czlonkostwa } = await supabase
    .from("chat_members")
    .select(
      "conversation_id, last_read_at, chat_conversations(id, title, kind, group_preset, village_id, listing_id, updated_at, villages(name))",
    )
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const { data: roleRows } = await supabase
    .from("user_village_roles")
    .select("village_id, villages(name)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const wsie = (roleRows ?? []).map((r) => {
    const v = Array.isArray(r.villages) ? r.villages[0] : r.villages;
    return { id: r.village_id, name: (v as { name: string } | null)?.name ?? "Wieś" };
  });

  type KonwersacjaJoin = {
    id: string;
    title: string | null;
    kind: string;
    group_preset: string | null;
    village_id: string;
    listing_id: string | null;
    updated_at: string;
    villages: { name: string } | { name: string }[] | null;
  };

  const listaBazowa = (czlonkostwa ?? [])
    .map((c) => {
      const conv = (Array.isArray(c.chat_conversations)
        ? c.chat_conversations[0]
        : c.chat_conversations) as KonwersacjaJoin | null;
      if (!conv) return null;
      const v = Array.isArray(conv.villages) ? conv.villages[0] : conv.villages;
      const tytul =
        conv.title ??
        (conv.kind === "group" ? etykietaPresetu(conv.group_preset) : conv.listing_id ? "Ogłoszenie" : "Rozmowa");
      return {
        id: conv.id,
        tytul,
        wies: v?.name ?? "",
        kind: conv.kind,
        preset: conv.group_preset,
        listing_id: conv.listing_id ?? null,
        updated_at: conv.updated_at,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  const ids = listaBazowa.map((k) => k.id);
  const ostatnieMap = new Map<
    string,
    { body: string; created_at: string; sender_id: string }
  >();

  if (ids.length > 0) {
    const { data: ostatnieRaw } = await supabase
      .from("chat_messages")
      .select("conversation_id, body, created_at, sender_id")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false })
      .limit(Math.min(ids.length * 3, 300));

    for (const w of ostatnieRaw ?? []) {
      if (!ostatnieMap.has(w.conversation_id)) {
        ostatnieMap.set(w.conversation_id, {
          body: w.body,
          created_at: w.created_at,
          sender_id: w.sender_id,
        });
      }
    }
  }

  const nieprzeczytane = await pobierzNieprzeczytanePoKonwersacji(supabase, user.id);

  const listingIds = Array.from(
    new Set(listaBazowa.map((k) => k.listing_id).filter((id): id is string => Boolean(id))),
  );
  const listingMiniatury = new Map<string, string>();
  if (listingIds.length > 0) {
    const { data: listingRows } = await supabase
      .from("marketplace_listings")
      .select("id, image_urls")
      .in("id", listingIds);
    for (const row of listingRows ?? []) {
      const url = row.image_urls?.[0];
      if (url) listingMiniatury.set(row.id, url);
    }
  }

  const konwersacje: WierszKonwersacjiCzat[] = listaBazowa
    .map((k) => {
      const ost = ostatnieMap.get(k.id);
      return {
        ...k,
        listing_image_url: k.listing_id ? listingMiniatury.get(k.listing_id) ?? null : null,
        ostatnia_wiadomosc: ost?.body ?? null,
        ostatnia_wiadomosc_at: ost?.created_at ?? null,
        ostatnia_od_mnie: ost ? ost.sender_id === user.id : false,
        nieprzeczytane: nieprzeczytane[k.id] ?? 0,
      };
    })
    .sort(
      (a, b) =>
        Date.parse(b.ostatnia_wiadomosc_at ?? b.updated_at) -
        Date.parse(a.ostatnia_wiadomosc_at ?? a.updated_at),
    );

  const lacznieNieprzeczytane = Object.values(nieprzeczytane).reduce((s, n) => s + n, 0);

  return (
    <main className="mx-auto w-full max-w-7xl">
      <NaglowekModuluPanelu
        etykieta="Komunikacja"
        tytul="Wiadomości"
        hrefPowrotu="/panel"
        etykietaPowrotu="← Panel"
        opis="Czat jak w komunikatorze — rozmowy przy ogłoszeniach na rynku, grupy mieszkańców, KGW, myśliwi, OSP."
        dzieci={
          lacznieNieprzeczytane > 0 ? (
            <span className="rounded-full bg-green-800 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              {lacznieNieprzeczytane} nieprzeczytanych
            </span>
          ) : null
        }
      />

      <CzatListaGrupKlient wsie={wsie} />
      <CzatListaKonwersacjiKlient konwersacje={konwersacje} />
    </main>
  );
}
