import type { AktywnoscStravaSkrot } from "@/lib/strava/mapuj-aktywnosc";
import { pobierzWaznyTokenStrava } from "@/lib/strava/token-store";

const API = "https://www.strava.com/api/v3";

async function stravaFetch<T>(userId: string, path: string, query?: Record<string, string>): Promise<T> {
  const token = await pobierzWaznyTokenStrava(userId);
  if (!token) throw new Error("Brak połączenia ze Strava");

  const url = new URL(`${API}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v) url.searchParams.set(k, v);
    }
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  });

  if (res.status === 401) {
    throw new Error("Sesja Strava wygasła — połącz konto ponownie.");
  }
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Strava API ${res.status}: ${txt.slice(0, 160)}`);
  }

  return res.json() as Promise<T>;
}

/** GET /athlete/activities — ostatnie aktywności zalogowanego zawodnika. */
export async function pobierzOstatnieAktywnosciStrava(
  userId: string,
  perPage = 20,
): Promise<AktywnoscStravaSkrot[]> {
  const lista = await stravaFetch<AktywnoscStravaSkrot[]>(userId, "/athlete/activities", {
    page: "1",
    per_page: String(Math.min(perPage, 30)),
  });
  return Array.isArray(lista) ? lista : [];
}

/** GET /activities/{id} */
export async function pobierzAktywnoscStravaPoId(
  userId: string,
  activityId: number,
): Promise<AktywnoscStravaSkrot> {
  return stravaFetch<AktywnoscStravaSkrot>(userId, `/activities/${activityId}`);
}
