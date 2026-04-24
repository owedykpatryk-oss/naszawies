import type { ElementPlanuSali, PlanSaliJson } from "./plan-sali";
import {
  STREFA_SALI_GLOWNEJ_ID,
  UKLAD_STOLOW_W_SALI_STUDZIENKI,
  wspRzutuDoSkaliPlanuSali,
  znajdzStrefe,
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

/**
 * Wymiary sali: metraż z tabeli (72,58 m²) + proporcje prostokąta 1.6 na rzucie (34:72 w układzie PNG).
 * Długość 12,4 m — skrót z osi dłuższej; szerokość daje iloraz metrażu.
 */
const SALA_DL_m = 12.4;
const SALA_SZE_m = Math.round((72.58 / SALA_DL_m) * 100) / 100;

/**
 * Plan sali odczytany z tego samego szkicu co `UKLAD_STOLOW_W_SALI_STUDZIENKI` / interaktywny rzut Studzienek.
 * Użycie: seed bazy, testy, ewentualny import w panelu.
 */
export function planSaliStudzienkiPoczatkowy(): PlanSaliJson {
  const sala = znajdzStrefe(STREFA_SALI_GLOWNEJ_ID)?.rect;
  if (!sala) {
    return { wersja: 1, szerokosc_sali_m: SALA_SZE_m, dlugosc_sali_m: SALA_DL_m, elementy: [] };
  }

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
