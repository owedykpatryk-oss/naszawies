import type { ElementArchRzutu, PomieszczenieRzutuParteru, RzutParteruSaliJson } from "./rzut-parteru-sali";

export type ProstokatProc = { x: number; y: number; w: number; h: number };

const VB_PLAN_W = 100;
const VB_PLAN_H = 70;

/** Wybiera pomieszczenie sali głównej do mapowania planu stołów. */
export function znajdzSalaGlowna(rzut: RzutParteruSaliJson): PomieszczenieRzutuParteru | null {
  if (rzut.sala_glowna_id) {
    const znaleziona = rzut.pomieszczenia.find((p) => p.id === rzut.sala_glowna_id);
    if (znaleziona) return znaleziona;
  }
  const zSala = rzut.pomieszczenia.filter(
    (p) => p.nazwa.toLowerCase().includes("sala") || p.id.toLowerCase().includes("sala"),
  );
  if (zSala.length === 1) return zSala[0]!;
  if (zSala.length > 1) {
    return zSala.reduce((a, b) => (a.w * a.h > b.w * b.h ? a : b));
  }
  if (rzut.pomieszczenia.length === 1) return rzut.pomieszczenia[0]!;
  return rzut.pomieszczenia.reduce((a, b) => (a.w * a.h > b.w * b.h ? a : b), rzut.pomieszczenia[0]!);
}

/** Obszar stołów w skali planu 100×70 (domyślnie cała płaszczyzna). */
export function wyznaczObszarStolow(rzut: RzutParteruSaliJson | null): ProstokatProc {
  if (!rzut) return { x: 0, y: 0, w: VB_PLAN_W, h: VB_PLAN_H };
  const sala = znajdzSalaGlowna(rzut);
  if (!sala) return { x: 0, y: 0, w: VB_PLAN_W, h: VB_PLAN_H };
  return { x: 0, y: 0, w: VB_PLAN_W, h: VB_PLAN_H };
}

/** Mapuje punkt z rzutu parteru (0–100) na plan stołów względem sali głównej. */
export function mapujPunktRzutuNaPlan(
  x: number,
  y: number,
  rzut: RzutParteruSaliJson,
): { x: number; y: number } {
  const sala = znajdzSalaGlowna(rzut);
  if (!sala || sala.w <= 0 || sala.h <= 0) {
    return { x: Math.min(VB_PLAN_W, Math.max(0, x)), y: Math.min(VB_PLAN_H, Math.max(0, y * 0.7)) };
  }
  return {
    x: Math.round(((x - sala.x) / sala.w) * VB_PLAN_W * 100) / 100,
    y: Math.round(((y - sala.y) / sala.h) * VB_PLAN_H * 100) / 100,
  };
}

/** Znaczniki architektoniczne z rzutu — tylko te w obrębie sali głównej — na plan stołów. */
export function znacznikiNaPlanieStolow(
  rzut: RzutParteruSaliJson | null,
): { typ: ElementArchRzutu["typ"]; etykieta: string; x: number; y: number; w: number; h: number }[] {
  if (!rzut?.elementy_arch?.length) return [];
  const sala = znajdzSalaGlowna(rzut);
  if (!sala) return [];

  return rzut.elementy_arch
    .filter((z) => {
      const cx = z.x ?? (z.x1! + (z.x2 ?? z.x1!)) / 2;
      const cy = z.y ?? (z.y1! + (z.y2 ?? z.y1!)) / 2;
      return cx >= sala.x && cx <= sala.x + sala.w && cy >= sala.y && cy <= sala.y + sala.h;
    })
    .map((z) => {
      const rx = z.x ?? Math.min(z.x1!, z.x2 ?? z.x1!);
      const ry = z.y ?? Math.min(z.y1!, z.y2 ?? z.y1!);
      const rw = z.w ?? Math.abs((z.x2 ?? z.x1!) - z.x1!);
      const rh = z.h ?? Math.abs((z.y2 ?? z.y1!) - z.y1!);
      const p1 = mapujPunktRzutuNaPlan(rx, ry, rzut);
      const p2 = mapujPunktRzutuNaPlan(rx + rw, ry + rh, rzut);
      return {
        typ: z.typ,
        etykieta: z.etykieta ?? z.typ,
        x: p1.x,
        y: p1.y,
        w: Math.max(0.5, p2.x - p1.x),
        h: Math.max(0.5, p2.y - p1.y),
      };
    });
}

/** Czy element planu mieści się w obszarze sali. */
export function elementWObszarze(
  el: { x: number; y: number; szer: number; wys: number },
  obszar: ProstokatProc,
): boolean {
  return (
    el.x >= obszar.x &&
    el.y >= obszar.y &&
    el.x + el.szer <= obszar.x + obszar.w &&
    el.y + el.wys <= obszar.y + obszar.h
  );
}

export function ograniczElementDoObszaru(
  el: { x: number; y: number; szer: number; wys: number },
  obszar: ProstokatProc,
): { x: number; y: number } {
  const x = Math.min(Math.max(obszar.x, el.x), obszar.x + obszar.w - el.szer);
  const y = Math.min(Math.max(obszar.y, el.y), obszar.y + obszar.h - el.wys);
  return { x, y };
}
