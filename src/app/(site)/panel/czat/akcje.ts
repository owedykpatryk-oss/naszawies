"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { utworzKlientaSupabaseSerwer } from "@/lib/supabase/serwer";

const uuid = z.string().uuid();

export type WynikCzat = { blad: string } | { ok: true; conversationId?: string; wiadomosc?: WiadomoscCzatZwrot };

export type WiadomoscCzatZwrot = {
  id: string;
  body: string;
  created_at: string;
  sender_id: string;
};

export async function rozpocznijCzatZOgloszenia(listingId: string): Promise<WynikCzat> {
  const id = uuid.safeParse(listingId);
  if (!id.success) return { blad: "Niepoprawne ogłoszenie." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się, aby napisać wiadomość." };

  const { data, error } = await supabase.rpc("chat_start_listing_conversation", {
    p_listing_id: id.data,
  });

  if (error) {
    const msg = error.message;
    if (msg.includes("own_listing")) return { blad: "To Twoje ogłoszenie." };
    if (msg.includes("not_resident")) return { blad: "Musisz być mieszkańcem tej wsi." };
    return { blad: "Nie udało się rozpocząć rozmowy." };
  }

  const convId = String(data);
  revalidatePath("/panel/czat");
  return { ok: true, conversationId: convId };
}

const presetSchema = z.enum(["mieszkancy", "kgw", "mysliwi", "osp", "rada_solecka"]);

export async function dolaczDoGrupyPreset(
  villageId: string,
  preset: z.infer<typeof presetSchema>,
): Promise<WynikCzat> {
  const vid = uuid.safeParse(villageId);
  const pr = presetSchema.safeParse(preset);
  if (!vid.success || !pr.success) return { blad: "Sprawdź dane grupy." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data, error } = await supabase.rpc("chat_get_or_create_preset_group", {
    p_village_id: vid.data,
    p_preset: pr.data,
  });

  if (error) return { blad: "Nie udało się dołączyć do grupy." };
  revalidatePath("/panel/czat");
  return { ok: true, conversationId: String(data) };
}

export async function utworzGrupeWlasna(villageId: string, tytul: string): Promise<WynikCzat> {
  const vid = uuid.safeParse(villageId);
  const t = z.string().trim().min(3).max(80).safeParse(tytul);
  if (!vid.success || !t.success) return { blad: "Podaj nazwę grupy (3–80 znaków)." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: conv, error } = await supabase
    .from("chat_conversations")
    .insert({
      village_id: vid.data,
      kind: "group",
      group_preset: "wlasna",
      title: t.data,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !conv) return { blad: "Nie udało się utworzyć grupy." };

  await supabase.from("chat_members").insert({
    conversation_id: conv.id,
    user_id: user.id,
    is_admin: true,
  });

  revalidatePath("/panel/czat");
  return { ok: true, conversationId: conv.id };
}

export async function wyslijWiadomoscCzat(conversationId: string, body: string): Promise<WynikCzat> {
  const cid = uuid.safeParse(conversationId);
  const tekst = z.string().trim().min(1).max(4000).safeParse(body);
  if (!cid.success || !tekst.success) return { blad: "Wpisz wiadomość." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: wiersz, error } = await supabase
    .from("chat_messages")
    .insert({
      conversation_id: cid.data,
      sender_id: user.id,
      body: tekst.data,
    })
    .select("id, body, created_at, sender_id")
    .single();

  if (error || !wiersz) return { blad: "Nie udało się wysłać." };

  await supabase
    .from("chat_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", cid.data)
    .eq("user_id", user.id);

  await supabase
    .from("chat_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", cid.data);

  const { data: conv } = await supabase
    .from("chat_conversations")
    .select("title, kind, group_preset, listing_id")
    .eq("id", cid.data)
    .maybeSingle();

  const { data: nadawca } = await supabase.from("users").select("display_name").eq("id", user.id).maybeSingle();

  const { data: czlonkowie } = await supabase
    .from("chat_members")
    .select("user_id")
    .eq("conversation_id", cid.data)
    .neq("user_id", user.id);

  const odbiorcy = (czlonkowie ?? []).map((c) => c.user_id);
  if (odbiorcy.length > 0) {
    const { etykietaPresetu } = await import("@/lib/czat/grupy-preset");
    const tytulKonwersacji =
      conv?.title ??
      (conv?.kind === "group"
        ? etykietaPresetu(conv.group_preset)
        : conv?.listing_id
          ? "Wiadomość przy ogłoszeniu"
          : "Rozmowa");
    const { powiadomONowejWiadomosciCzat } = await import("@/lib/powiadomienia/powiadom-o-wiadomosci-czat");
    await powiadomONowejWiadomosciCzat({
      odbiorcyIds: odbiorcy,
      conversationId: cid.data,
      tytulKonwersacji,
      fragment: tekst.data,
      nadawcaNazwa: nadawca?.display_name ?? "Mieszkaniec",
    });
  }

  revalidatePath(`/panel/czat/${cid.data}`);
  revalidatePath("/panel/czat");
  return { ok: true, wiadomosc: wiersz };
}

export async function pobierzStarszeWiadomosciCzat(
  conversationId: string,
  przedCreatedAt: string,
): Promise<{ blad: string } | { ok: true; wiadomosci: WiadomoscCzatZwrot[]; nadawcy: Record<string, string> }> {
  const cid = uuid.safeParse(conversationId);
  const przed = z.string().min(10).safeParse(przedCreatedAt);
  if (!cid.success || !przed.success) return { blad: "Niepoprawne dane." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: czlonkostwo } = await supabase
    .from("chat_members")
    .select("user_id")
    .eq("conversation_id", cid.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!czlonkostwo) return { blad: "Brak dostępu." };

  const { data: wiadRaw } = await supabase
    .from("chat_messages")
    .select("id, body, created_at, sender_id, users(display_name)")
    .eq("conversation_id", cid.data)
    .lt("created_at", przed.data)
    .order("created_at", { ascending: false })
    .limit(50);

  const wiersze = (wiadRaw ?? []).reverse();
  const nadawcy: Record<string, string> = {};
  for (const w of wiersze) {
    const u = Array.isArray(w.users) ? w.users[0] : w.users;
    nadawcy[w.sender_id] = (u as { display_name: string } | null)?.display_name ?? "Użytkownik";
  }

  return {
    ok: true,
    wiadomosci: wiersze.map((w) => ({
      id: w.id,
      body: w.body,
      created_at: w.created_at,
      sender_id: w.sender_id,
    })),
    nadawcy,
  };
}

export async function zaprosDoGrupyCzatu(conversationId: string, inviteUserId: string): Promise<WynikCzat> {
  const cid = uuid.safeParse(conversationId);
  const uid = uuid.safeParse(inviteUserId);
  if (!cid.success || !uid.success) return { blad: "Niepoprawne dane zaproszenia." };

  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { blad: "Zaloguj się." };

  const { data: conv } = await supabase
    .from("chat_conversations")
    .select("id, village_id, kind, group_preset")
    .eq("id", cid.data)
    .maybeSingle();

  if (!conv || conv.kind !== "group" || conv.group_preset !== "wlasna") {
    return { blad: "Zaproszenia tylko do własnej grupy." };
  }

  const { data: admin } = await supabase
    .from("chat_members")
    .select("is_admin")
    .eq("conversation_id", cid.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin?.is_admin) return { blad: "Tylko administrator grupy może zapraszać." };

  if (uid.data === user.id) return { blad: "Nie możesz zaprosić samego siebie." };

  const { data: rola } = await supabase
    .from("user_village_roles")
    .select("id")
    .eq("user_id", uid.data)
    .eq("village_id", conv.village_id)
    .eq("status", "active")
    .maybeSingle();

  if (!rola) return { blad: "Osoba nie jest mieszkańcem tej wsi." };

  const { error } = await supabase.from("chat_members").insert({
    conversation_id: cid.data,
    user_id: uid.data,
    is_admin: false,
  });

  if (error) {
    if (error.code === "23505") return { blad: "Ta osoba jest już w grupie." };
    return { blad: "Nie udało się zaprosić." };
  }

  revalidatePath(`/panel/czat/${cid.data}`);
  return { ok: true };
}

export async function oznaczPrzeczytane(conversationId: string): Promise<void> {
  const cid = uuid.safeParse(conversationId);
  if (!cid.success) return;
  const supabase = utworzKlientaSupabaseSerwer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("chat_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", cid.data)
    .eq("user_id", user.id);
}
