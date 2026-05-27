/** Gotowe szablony notatek przy zamykaniu zgłoszenia (sołtys). */
export const SZABLONY_ODPOWIEDZI_ZGLOSZEN = [
  {
    id: "przekazano",
    label: "Przekazano do gminy",
    body: "Sprawa została przekazana do urzędu gminy. Oczekujemy informacji zwrotnej — damy znać na stronie wsi.",
  },
  {
    id: "w_trakcie",
    label: "W realizacji",
    body: "Zgłoszenie jest w trakcie realizacji. Prace planowane w najbliższym czasie — dziękujemy za cierpliwość.",
  },
  {
    id: "naprawione",
    label: "Naprawione",
    body: "Problem został usunięty / naprawiony. Dziękujemy za zgłoszenie — pomaga nam dbać o porządek we wsi.",
  },
  {
    id: "brak_podstaw",
    label: "Brak podstaw",
    body: "Po weryfikacji nie stwierdzono usterki w wskazanym miejscu. Jeśli problem nadal występuje, prosimy o nowe zgłoszenie ze zdjęciem.",
  },
] as const;
