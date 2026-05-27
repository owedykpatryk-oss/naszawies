import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { etykietaPresetu } from "@/lib/czat/grupy-preset";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";
import { oznaczPrzeczytane } from "../akcje";
import { CzatOknoKlient, type WiadomoscWiersz } from "../czat-okno-klient";
import { CzatZaproszeniaKlient, type MieszkaniecDoZaproszenia } from "../czat-zaproszenia-klient";

type Props = { params: { conversationId: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: "Rozmowa" };
}

export default async function CzatKonwersacjaPage({ params }: Props) {
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/logowanie?next=/panel/czat/${params.conversationId}`);

  const { data: conv } = await supabase
    .from("chat_conversations")
    .select("id, title, kind, group_preset, village_id, listing_id, villages(name)")
    .eq("id", params.conversationId)
    .maybeSingle();

  if (!conv) notFound();

  const { data: czlonkostwo } = await supabase
    .from("chat_members")
    .select("user_id, is_admin")
    .eq("conversation_id", params.conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

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

  return (
    <main>
      <p className="text-sm text-stone-500">
        <Link href="/panel/czat" className="text-green-800 underline">
          ← Wiadomości
        </Link>
      </p>
      <h1 className="mt-2 font-serif text-2xl text-green-950">{tytul}</h1>
      <p className="text-sm text-stone-600">{(v as { name: string } | null)?.name ?? ""}</p>
      {conv.kind === "group" && conv.group_preset === "wlasna" && czlonkostwo.is_admin ? (
        <CzatZaproszeniaKlient conversationId={params.conversationId} mieszkancy={doZaproszenia} />
      ) : null}
      <div className="mt-4">
        <CzatOknoKlient
          conversationId={params.conversationId}
          wiadomosci={wiadomosci}
          mojUserId={user.id}
        />
      </div>
    </main>
  );
}
