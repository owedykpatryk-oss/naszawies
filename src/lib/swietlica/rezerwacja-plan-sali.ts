import type { PlanSaliJson } from "./plan-sali";
import { klonPlanuSali } from "./plan-sali";
import {
  generujBankietDlaGosci,
  generujKsztaltU,
  generujUkladTeatralny,
  generujWyspyWarsztatowe,
} from "./plan-sali-presety";

export type PresetUstawieniaSali =
  | "auto_bankiet"
  | "teatralny"
  | "warsztatowy"
  | "u_ksztalt"
  | "wlasny";

export type PlanRezerwacjiJson = PlanSaliJson & {
  preset?: PresetUstawieniaSali;
};

export function generujElementyDlaPresetu(
  preset: PresetUstawieniaSali,
  liczbaGosci: number,
): PlanSaliJson["elementy"] {
  switch (preset) {
    case "auto_bankiet":
      return generujBankietDlaGosci(liczbaGosci);
    case "teatralny":
      return generujUkladTeatralny(Math.ceil(liczbaGosci / 20));
    case "warsztatowy":
      return generujWyspyWarsztatowe(Math.ceil(liczbaGosci / 6));
    case "u_ksztalt":
      return generujKsztaltU();
    case "wlasny":
      return [];
    default:
      return generujBankietDlaGosci(liczbaGosci);
  }
}

/**
 * Buduje plan rezerwacji na bazie zapisanego planu sali sołtysa.
 * Presety generują nowe elementy; „własny” zachowuje plan sali lub przyjmuje edycję mieszkańca.
 */
export function zbudujPlanRezerwacji(
  planSali: PlanSaliJson | null,
  preset: PresetUstawieniaSali,
  liczbaGosci: number,
  planWlasny?: PlanSaliJson | null,
): PlanRezerwacjiJson | null {
  const bazowy = planSali && planSali.elementy.length > 0 ? klonPlanuSali(planSali) : null;

  if (preset === "wlasny") {
    if (planWlasny && planWlasny.elementy.length > 0) {
      return { ...planWlasny, preset: "wlasny" };
    }
    if (bazowy) {
      return { ...bazowy, preset: "wlasny" };
    }
    return null;
  }

  const elementy = generujElementyDlaPresetu(preset, liczbaGosci);
  return {
    wersja: 1,
    szerokosc_sali_m: bazowy?.szerokosc_sali_m ?? planSali?.szerokosc_sali_m ?? null,
    dlugosc_sali_m: bazowy?.dlugosc_sali_m ?? planSali?.dlugosc_sali_m ?? null,
    elementy,
    preset,
  };
}
