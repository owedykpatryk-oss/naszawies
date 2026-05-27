export const GRUPY_CZATU_PRESET = [
  { value: "mieszkancy", label: "Mieszkańcy wsi", opis: "Ogólny kanał sołectwa" },
  { value: "kgw", label: "KGW", opis: "Koło Gospodyń Wiejskich" },
  { value: "mysliwi", label: "Myśliwi", opis: "Koło łowieckie / myśliwi" },
  { value: "osp", label: "OSP", opis: "Ochotnicza straż pożarna" },
  { value: "rada_solecka", label: "Rada sołecka", opis: "Rada sołecka wsi" },
] as const;

export type PresetGrupyCzatu = (typeof GRUPY_CZATU_PRESET)[number]["value"];

export function etykietaPresetu(p: string | null | undefined) {
  return GRUPY_CZATU_PRESET.find((g) => g.value === p)?.label ?? p ?? "Grupa";
}
