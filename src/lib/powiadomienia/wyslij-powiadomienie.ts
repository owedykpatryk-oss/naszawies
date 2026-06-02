import type { SupabaseClient } from "@supabase/supabase-js";
import { wyslijWebPushDlaUzytkownika } from "@/lib/pwa/wyslij-web-push";
import { zaplanujPowiadomienieEmail } from "@/lib/email/zaplanuj-powiadomienie-email";

export type ParametryPowiadomienia = {
  userId: string;
  typ: string;
  tytul: string;
  tresc: string;
  linkUrl?: string | null;
  relatedId?: string | null;
  relatedType?: string | null;
  /** Gdy true — wysyła push natychmiast (poza kolejką digest). */
  pushNatychmiast?: boolean;
  /** Gdy true — wysyła e-mail natychmiast (poza digest). */
  emailNatychmiast?: boolean;
};

/**
 * Centralny punkt wysyłki powiadomień.
 * Preferuje RPC `wyslij_powiadomienie` (preferencje + kolejka digest).
 * Fallback: bezpośredni insert + opcjonalny push/e-mail.
 */
export async function wyslijPowiadomienie(
  admin: SupabaseClient,
  params: ParametryPowiadomienia,
): Promise<string | null> {
  const { data: rpcId, error: rpcErr } = await admin.rpc("wyslij_powiadomienie", {
    p_user_id: params.userId,
    p_typ: params.typ,
    p_tytul: params.tytul,
    p_tresc: params.tresc,
    p_link_url: params.linkUrl ?? null,
    p_related_id: params.relatedId ?? null,
    p_related_type: params.relatedType ?? null,
  });

  if (!rpcErr && rpcId) {
    if (params.pushNatychmiast) {
      await wyslijWebPushDlaUzytkownika(admin, {
        userId: params.userId,
        title: params.tytul,
        body: params.tresc,
        linkUrl: params.linkUrl,
        tag: params.typ,
      });
    }
    if (params.emailNatychmiast) {
      zaplanujPowiadomienieEmail(params.userId, params.tytul, params.tytul, [params.tresc]);
    }
    return rpcId as string;
  }

  if (rpcErr && !rpcErr.message.includes("Could not find the function")) {
    console.warn("[wyslijPowiadomienie] RPC:", rpcErr.message);
  }

  const { data: inserted, error: insErr } = await admin
    .from("notifications")
    .insert([
      {
        user_id: params.userId,
        type: params.typ,
        title: params.tytul,
        body: params.tresc,
        link_url: params.linkUrl ?? null,
        related_id: params.relatedId ?? null,
        related_type: params.relatedType ?? null,
        channel: "in_app",
      },
    ])
    .select("id")
    .maybeSingle();

  if (insErr) {
    console.warn("[wyslijPowiadomienie] insert:", insErr.message);
    return null;
  }

  await wyslijWebPushDlaUzytkownika(admin, {
    userId: params.userId,
    title: params.tytul,
    body: params.tresc,
    linkUrl: params.linkUrl,
    tag: params.typ,
  });

  if (params.emailNatychmiast) {
    zaplanujPowiadomienieEmail(params.userId, params.tytul, params.tytul, [params.tresc]);
  }

  return inserted?.id ?? null;
}

/** Wysyła powiadomienie do wielu użytkowników (deduplikacja ID). */
export async function wyslijPowiadomienieDoWielu(
  admin: SupabaseClient,
  userIds: string[],
  params: Omit<ParametryPowiadomienia, "userId">,
): Promise<void> {
  const unikalni = Array.from(new Set(userIds.filter(Boolean)));
  await Promise.all(
    unikalni.map((userId) =>
      wyslijPowiadomienie(admin, { ...params, userId }).catch((e) =>
        console.warn("[wyslijPowiadomienieDoWielu]", userId, e),
      ),
    ),
  );
}
