import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { stravaClientId, stravaClientSecret } from "@/lib/strava/konfiguracja";

type PolaczenieStrava = {
  user_id: string;
  strava_athlete_id: number;
  access_token: string;
  refresh_token: string;
  expires_at: string;
  scopes: string | null;
  athlete_firstname: string | null;
  athlete_lastname: string | null;
};

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete?: { id: number; firstname?: string; lastname?: string };
  scope?: string;
};

async function wymienToken(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Strava token error ${res.status}: ${txt.slice(0, 200)}`);
  }
  return res.json() as Promise<TokenResponse>;
}

export async function zapiszPolaczeniePoKodzie(userId: string, code: string): Promise<void> {
  const token = await wymienToken({
    client_id: stravaClientId(),
    client_secret: stravaClientSecret(),
    code,
    grant_type: "authorization_code",
  });

  const admin = createAdminSupabaseClient();
  if (!admin) throw new Error("Brak klienta admin Supabase");

  const expiresAt = new Date(token.expires_at * 1000).toISOString();
  const athleteId = token.athlete?.id;
  if (!athleteId) throw new Error("Brak ID zawodnika w odpowiedzi Strava");

  const { error } = await admin.from("user_strava_connections").upsert(
    {
      user_id: userId,
      strava_athlete_id: athleteId,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: expiresAt,
      scopes: token.scope ?? null,
      athlete_firstname: token.athlete?.firstname ?? null,
      athlete_lastname: token.athlete?.lastname ?? null,
    },
    { onConflict: "user_id" },
  );

  if (error) throw new Error(error.message);
}

export async function pobierzPolaczenieStrava(userId: string): Promise<PolaczenieStrava | null> {
  const admin = createAdminSupabaseClient();
  if (!admin) return null;
  const { data } = await admin.from("user_strava_connections").select("*").eq("user_id", userId).maybeSingle();
  return (data as PolaczenieStrava | null) ?? null;
}

export async function pobierzWaznyTokenStrava(userId: string): Promise<string | null> {
  const pol = await pobierzPolaczenieStrava(userId);
  if (!pol) return null;

  const wygasa = new Date(pol.expires_at).getTime();
  if (wygasa > Date.now() + 3600_000) {
    return pol.access_token;
  }

  const token = await wymienToken({
    client_id: stravaClientId(),
    client_secret: stravaClientSecret(),
    grant_type: "refresh_token",
    refresh_token: pol.refresh_token,
  });

  const admin = createAdminSupabaseClient();
  if (!admin) return null;

  const expiresAt = new Date(token.expires_at * 1000).toISOString();
  await admin
    .from("user_strava_connections")
    .update({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: expiresAt,
    })
    .eq("user_id", userId);

  return token.access_token;
}

export async function rozlaczStrava(userId: string): Promise<void> {
  const pol = await pobierzPolaczenieStrava(userId);
  const admin = createAdminSupabaseClient();
  if (!admin) return;

  if (pol?.access_token) {
    try {
      await fetch("https://www.strava.com/oauth/deauthorize", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ access_token: pol.access_token }),
      });
    } catch {
      /* deauthorize opcjonalne */
    }
  }

  await admin.from("user_strava_connections").delete().eq("user_id", userId);
}

export type StatusPolaczeniaStrava = {
  polaczone: boolean;
  athleteName: string | null;
  stravaAthleteId: number | null;
};

export async function statusPolaczeniaStrava(userId: string): Promise<StatusPolaczeniaStrava> {
  const pol = await pobierzPolaczenieStrava(userId);
  if (!pol) {
    return { polaczone: false, athleteName: null, stravaAthleteId: null };
  }
  const name = [pol.athlete_firstname, pol.athlete_lastname].filter(Boolean).join(" ").trim() || null;
  return {
    polaczone: true,
    athleteName: name,
    stravaAthleteId: pol.strava_athlete_id,
  };
}
