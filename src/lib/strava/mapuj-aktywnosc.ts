import type { RodzajAktywnosci } from "@/lib/wies/wywnioskuj-rodzaj-aktywnosci";
import { wywnioskujRodzajAktywnosci } from "@/lib/wies/wywnioskuj-rodzaj-aktywnosci";

export type AktywnoscStravaSkrot = {
  id: number;
  name: string;
  sport_type: string;
  type?: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  start_date: string;
  start_date_local: string;
  description?: string | null;
  private?: boolean;
};

/** Mapowanie SportType Strava → rodzaj w naszawies.pl */
export function rodzajAktywnosciZeStravy(a: Pick<AktywnoscStravaSkrot, "sport_type" | "type" | "name">): RodzajAktywnosci {
  const sport = (a.sport_type || a.type || "").toLowerCase();
  if (sport.includes("run")) return "bieg";
  if (sport.includes("ride") || sport.includes("cycling") || sport.includes("ebike")) return "rower";
  if (sport.includes("walk") || sport.includes("hike")) {
    const zTytulu = wywnioskujRodzajAktywnosci(a.name);
    if (zTytulu === "nordic_walking") return "nordic_walking";
    return "turystyka";
  }
  const zTytulu = wywnioskujRodzajAktywnosci(`${a.name} ${sport}`);
  return zTytulu ?? "inne";
}

export function urlAktywnosciStrava(id: number): string {
  return `https://www.strava.com/activities/${id}`;
}
