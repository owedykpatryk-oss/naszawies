import type { ElementPlanuSali, PlanSaliJson } from "./plan-sali";
import {
  PROSTOKAT_SALI_GLOWNEJ_PROC,
  UKLAD_STOLOW_W_SALI_STUDZIENKI,
  wspRzutuDoSkaliPlanuSali,
} from "@/components/wies/studzienki-rzut-dane";

/** Stabilne identyfikatory elementów — te same w migracji SQL i w tym module. */
const ID_STOLOW = [
  "6f2c8a10-1a3b-4b6d-8e1f-000000000001",
  "6f2c8a10-1a3b-4b6d-8e1f-000000000002",
  "6f2c8a10-1a3b-4b6d-8e1f-000000000003",
  "6f2c8a10-1a3b-4b6d-8e1f-000000000004",
  "6f2c8a10-1a3b-4b6d-8e1f-000000000005",
  "6f2c8a10-1a3b-4b6d-8e1f-000000000006",
] as const;

/** Część główna 1.6: **8,00 m** (E–W) × **6,60 m** (N–S) — w edytorze 100×70; doł w kształcie L tylko na interaktywnym rzucie. */
const SALA_SZE_m = 8.0;
const SALA_DL_m = 6.6;

/**
 * Plan sali odczytany z tego samego szkicu co `UKLAD_STOLOW_W_SALI_STUDZIENKI` / interaktywny rzut Studzienek.
 * Użycie: seed bazy, testy, ewentualny import w panelu.
 */
export function planSaliStudzienkiPoczatkowy(): PlanSaliJson {
  const sala = PROSTOKAT_SALI_GLOWNEJ_PROC;

  const elementy: ElementPlanuSali[] = UKLAD_STOLOW_W_SALI_STUDZIENKI.map((t, i) => {
    const { x, y, szer, wys } = wspRzutuDoSkaliPlanuSali(sala, t.x, t.y, t.szer, t.wys);
    const okr = t.typ === "okragly";
    const base: ElementPlanuSali = {
      id: ID_STOLOW[i]!,
      typ: okr ? "stol_okragly" : "stol_prostokatny",
      x,
      y,
      szer,
      wys,
      obrot: 0,
      etykieta: String(i + 1),
      miejsca: t.miejsca,
      szer_cm: okr ? 120 : 180,
      dl_cm: okr ? 120 : 80,
    };
    return base;
  });

  return {
    wersja: 1,
    szerokosc_sali_m: SALA_SZE_m,
    dlugosc_sali_m: SALA_DL_m,
    elementy,
  };
}
