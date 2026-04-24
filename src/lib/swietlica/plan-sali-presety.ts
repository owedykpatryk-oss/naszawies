import type { ElementPlanuSali } from "./plan-sali";

function noweId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `e-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function stolProst(
  x: number,
  y: number,
  szer: number,
  wys: number,
  etykieta: string,
  obrot = 0
): ElementPlanuSali {
  return {
    id: noweId(),
    typ: "stol_prostokatny",
    x,
    y,
    szer,
    wys,
    obrot,
    etykieta,
    miejsca: 8,
    szer_cm: 180,
    dl_cm: 80,
  };
}

function stolOkr(x: number, y: number, sred: number, etykieta: string): ElementPlanuSali {
  return {
    id: noweId(),
    typ: "stol_okragly",
    x,
    y,
    szer: sred,
    wys: sred,
    obrot: 0,
    etykieta,
    miejsca: 8,
    szer_cm: 120,
    dl_cm: 120,
  };
}

/** 8 stołów prostokątnych w siatce 2×4 (bankiet, orientacyjnie). */
export function generujBankiet2x4(): ElementPlanuSali[] {
  const szer = 10;
  const wys = 7.5;
  const gx = 3.5;
  const gy = 3.2;
  const st: ElementPlanuSali[] = [];
  let n = 1;
  for (let rz = 0; rz < 2; rz++) {
    for (let k = 0; k < 4; k++) {
      st.push(stolProst(4 + k * (szer + gx), 8 + rz * (wys + gy), szer, wys, String(n)));
      n += 1;
    }
  }
  return st;
}

/** Rząd okrągłych stołów. */
export function generujRzadOkraglych(ile: 4 | 5 | 6): ElementPlanuSali[] {
  const p = ile;
  const prom = 4.2;
  const srednica = prom * 2;
  const odstep = 3.6;
  const razem = p * srednica + (p - 1) * odstep;
  const x0 = Math.max(2, (100 - razem) / 2);
  const yC = 31.5;
  const wynik: ElementPlanuSali[] = [];
  for (let i = 0; i < p; i++) {
    const x = x0 + i * (srednica + odstep);
    wynik.push(stolOkr(x, yC - prom, srednica, String(i + 1)));
  }
  return wynik;
}

/** Szkic układu w kształcie U: trzy segmenty (do dopracowania ręcznie). */
export function generujKsztaltU(): ElementPlanuSali[] {
  return [
    stolProst(8, 10, 12, 6, "1", 0),
    stolProst(46, 10, 12, 6, "2", 0),
    stolProst(8, 40, 50, 7, "3", 0),
  ];
}
