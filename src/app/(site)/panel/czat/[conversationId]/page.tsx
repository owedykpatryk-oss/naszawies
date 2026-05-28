import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { etykietaPresetu } from "@/lib/czat/grupy-preset";
import { sciezkaProfiluWsi } from "@/lib/wies/sciezka-publiczna";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { oznaczPrzeczytane } from "../akcje";
import { CzatKontekstOgloszenia, type KontekstOgloszeniaCzat } from "../czat-kontekst-ogloszenia";
import { CzatOknoKlient, type WiadomoscWiersz } from "../czat-okno-klient";
import { CzatZaproszeniaKlient, type MieszkaniecDoZaproszenia } from "../czat-zaproszenia-klient";

type Props = { params: { conversationId: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = utworzKlientaSupabaseSerwer();
  const { data: conv } = await supabase
    .from("chat_conversations")
    .select("title, kind, group_preset, listing_id")
    .eq("id", params.conversationId)
    .maybeSingle();

  if (!conv) return { title: "Rozmowa" };

  const tytul =
    conv.title ??
    (conv.kind === "group"
      ? etykietaPresetu(conv.group_preset)
      : conv.listing_id
        ? "Wiadomość przy ogłoszeniu"
        : "Rozmowa");

  return { title: `${tytul} · Wiadomości` };
}

export default async function CzatKonwersacjaPage({ params }: Props) {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/logowanie?next=/panel/czat/${params.conversationId}`);

  const [{ data: profilJa }, { data: conv }] = await Promise.all([
    supabase.from("users").select("display_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("chat_conversations")
      .select("id, title, kind, group_preset, village_id, listing_id, villages(name)")
      .eq("id", params.conversationId)
      .maybeSingle(),
  ]);

  if (!conv) notFound();

  const [{ data: czlonkostwo }, { data: czlonkowieRaw }, { count: liczbaWiadomosci }] = await Promise.all([
    supabase
      .from("chat_members")
      .select("user_id, is_admin")
      .eq("conversation_id", params.conversationId)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("chat_members")
      .select("user_id, last_read_at")
      .eq("conversation_id", params.conversationId)
      .neq("user_id", user.id),
    supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", params.conversationId),
  ]);

  if (!czlonkostwo) notFound();

  await oznaczPrzeczytane(params.conversationId);

  const { data: wiadRaw } = await supabase
    .from("chat_messages")
    .select("id, body, created_at, sender_id, users(display_name)")
    .eq("conversation_id", params.conversationId)
    .order("created_at", { ascending: true })
    .limit(200);

  const wiadomosci: WiadomoscWiersz[] = (wiadRaw ?? []).map((w) => {
    const u = Array.isArray(w.users) ? w.users[0] : w.users;
    return {
      id: w.id,
      body: w.body,
      created_at: w.created_at,
      sender_id: w.sender_id,
      nadawca: (u as { display_name: string } | null)?.display_name ?? "Użytkownik",
      toJa: w.sender_id === user.id,
    };
  });

  const v = Array.isArray(conv.villages) ? conv.villages[0] : conv.villages;
  const tytul =
    conv.title ??
    (conv.kind === "group" ? etykietaPresetu(conv.group_preset) : conv.listing_id ? "Wiadomość przy ogłoszeniu" : "Rozmowa");

  let kontekstOgloszenia: KontekstOgloszeniaCzat | null = null;
  if (conv.listing_id) {
    const { data: ogl } = await supabase
      .from("marketplace_listings")
      .select("id, title, listing_type, status, image_urls, villages(voivodeship, county, commune, slug)")
      .eq("id", conv.listing_id)
      .maybeSingle();

    if (ogl) {
      const vw = Array.isArray(ogl.villages) ? ogl.villages[0] : ogl.villages;
      const href =
        vw && typeof vw === "object" && "slug" in vw
          ? `${sciezkaProfiluWsi(vw as { voivodeship: string; county: string; commune: string; slug: string })}/rynek/${ogl.id}`
          : "#";
      kontekstOgloszenia = {
        id: ogl.id,
        title: ogl.title,
        listing_type: ogl.listing_type,
        status: ogl.status,
        image_url: ogl.image_urls?.[0] ?? null,
        href,
      };
    }
  }

  let doZaproszenia: MieszkaniecDoZaproszenia[] = [];
  if (conv.kind === "group" && conv.group_preset === "wlasna" && czlonkostwo.is_admin) {
    const { data: roleRows } = await supabase
      .from("user_village_roles")
      .select("user_id, users(display_name)")
      .eq("village_id", conv.village_id)
      .eq("status", "active")
      .neq("user_id", user.id);

    const { data: juzWGrupie } = await supabase
      .from("chat_members")
      .select("user_id")
      .eq("conversation_id", params.conversationId);

    const wGrupie = new Set((juzWGrupie ?? []).map((m) => m.user_id));

    doZaproszenia = (roleRows ?? [])
      .filter((r) => !wGrupie.has(r.user_id))
      .map((r) => {
        const u = Array.isArray(r.users) ? r.users[0] : r.users;
        return {
          user_id: r.user_id,
          display_name: (u as { display_name: string } | null)?.display_name ?? "Mieszkaniec",
        };
      });
  }

  const liczbaCzlonkow = (czlonkowieRaw?.length ?? 0) + 1;
  const odczytInnych = (czlonkowieRaw ?? []).map((c) => ({
    user_id: c.user_id,
    last_read_at: c.last_read_at,
  }));

  return (
    <main>
      <p className="text-sm text-stone-500">
        <Link href="/panel/czat" className="text-green-800 underline">
          ← Wiadomości
        </Link>
      </p>
      <header className="mt-2 rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-stone-500">
          {conv.kind === "group" ? "Grupa" : "Rozmowa przy ogłoszeniu"}
        </p>
        <h1 className="mt-1 font-serif text-2xl text-green-950">{tytul}</h1>
        <p className="mt-1 text-sm text-stone-600">
          {(v as { name: string } | null)?.name ?? ""}
          {conv.kind === "group" ? ` · ${liczbaCzlonkow} ${liczbaCzlonkow === 1 ? "uczestnik" : "uczestników"}` : ""}
        </p>
      </header>

      {kontekstOgloszenia ? <CzatKontekstOgloszenia ogloszenie={kontekstOgloszenia} /> : null}

      {conv.kind === "group" && conv.group_preset === "wlasna" && czlonkostwo.is_admin ? (
        <CzatZaproszeniaKlient conversationId={params.conversationId} mieszkancy={doZaproszenia} />
      ) : null}

      <div className="mt-4">
        <CzatOknoKlient
          conversationId={params.conversationId}
          wiadomosci={wiadomosci}
          mojUserId={user.id}
          mojaNazwa={profilJa?.display_name ?? "Ty"}
          kind={conv.kind === "group" ? "group" : "direct"}
          odczytInnych={odczytInnych}
          maStarsze={(liczbaWiadomosci ?? 0) > wiadomosci.length}
        />
      </div>
    </main>
  );
}
