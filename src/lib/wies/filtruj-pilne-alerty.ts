export type AlertWiesPubliczny = {
  id: string;
  title: string;
  type: string;
  is_pinned: boolean;
  event_end_at: string | null;
  created_at: string;
};

/** Posty awaryjne / przypięte, które nie wygasły (event_end_at). */
export function filtrujPilneAlerty(
  posty: {
    id: string;
    title: string;
    type: string;
    is_pinned?: boolean | null;
    event_end_at?: string | null;
    created_at: string;
  }[],
  limit = 5,
): AlertWiesPubliczny[] {
  const teraz = Date.now();
  return posty
    .filter((p) => {
      if (p.type !== "awaria" && !p.is_pinned) return false;
      if (p.event_end_at) {
        const t = Date.parse(p.event_end_at);
        if (Number.isFinite(t) && t < teraz) return false;
      }
      return true;
    })
    .slice(0, limit)
    .map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      is_pinned: Boolean(p.is_pinned),
      event_end_at: p.event_end_at ?? null,
      created_at: p.created_at,
    }));
}
