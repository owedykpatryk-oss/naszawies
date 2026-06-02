/** Zmienne Strava API v3 — https://developers.strava.com/docs/authentication/ */

export function czyStravaSkonfigurowana(): boolean {
  return Boolean(
    process.env.STRAVA_CLIENT_ID?.trim() &&
      process.env.STRAVA_CLIENT_SECRET?.trim() &&
      process.env.NEXT_PUBLIC_SITE_URL?.trim(),
  );
}

export function stravaClientId(): string {
  const id = process.env.STRAVA_CLIENT_ID?.trim();
  if (!id) throw new Error("Brak STRAVA_CLIENT_ID");
  return id;
}

export function stravaClientSecret(): string {
  const s = process.env.STRAVA_CLIENT_SECRET?.trim();
  if (!s) throw new Error("Brak STRAVA_CLIENT_SECRET");
  return s;
}

export function stravaRedirectUri(): string {
  const baza = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (!baza) throw new Error("Brak NEXT_PUBLIC_SITE_URL");
  return `${baza}/api/strava/callback`;
}

/** Zakres: odczyt aktywności (także prywatnych — tylko dla importu przez użytkownika). */
export const STRAVA_SCOPES = "read,activity:read_all";

export function urlAutoryzacjiStrava(state: string): string {
  const params = new URLSearchParams({
    client_id: stravaClientId(),
    redirect_uri: stravaRedirectUri(),
    response_type: "code",
    approval_prompt: "auto",
    scope: STRAVA_SCOPES,
    state,
  });
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}
