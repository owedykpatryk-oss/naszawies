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

/** Układ teatralny: krótkie ławki w rzędach (bez stołów), pod zebrania / prezentacje. */
export function generujUkladTeatralny(liczbaRzedow: number): ElementPlanuSali[] {
  const rzedy = Math.max(2, Math.min(10, Math.trunc(liczbaRzedow)));
  const wynik: ElementPlanuSali[] = [];
  const startY = 8;
  const odstepY = 5.5;
  for (let r = 0; r < rzedy; r++) {
    const y = startY + r * odstepY;
    wynik.push({
      id: noweId(),
      typ: "lawka",
      x: 12,
      y,
      szer: 32,
      wys: 3.8,
      obrot: 0,
      etykieta: `L${r * 2 + 1}`,
      miejsca: 10,
      szer_cm: 220,
      dl_cm: 40,
    });
    wynik.push({
      id: noweId(),
      typ: "lawka",
      x: 56,
      y,
      szer: 32,
      wys: 3.8,
      obrot: 0,
      etykieta: `L${r * 2 + 2}`,
      miejsca: 10,
      szer_cm: 220,
      dl_cm: 40,
    });
  }
  return wynik;
}

/** Wyspy warsztatowe: stoły prostokątne po 6 miejsc, wygodne do pracy w grupach. */
export function generujWyspyWarsztatowe(ileWysp: number): ElementPlanuSali[] {
  const wyspy = Math.max(2, Math.min(12, Math.trunc(ileWysp)));
  const cols = wyspy <= 6 ? 2 : 3;
  const rows = Math.ceil(wyspy / cols);
  const szer = 14;
  const wys = 8.5;
  const gapX = 7;
  const gapY = 5;
  const totalW = cols * szer + (cols - 1) * gapX;
  const totalH = rows * wys + (rows - 1) * gapY;
  const startX = Math.max(2, (100 - totalW) / 2);
  const startY = Math.max(4, (70 - totalH) / 2);
  const out: ElementPlanuSali[] = [];
  let n = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (n > wyspy) break;
      out.push({
        ...stolProst(startX + c * (szer + gapX), startY + r * (wys + gapY), szer, wys, String(n)),
        miejsca: 6,
        szer_cm: 160,
        dl_cm: 80,
      });
      n += 1;
    }
  }
  return out;
}

/** Bankiet automatyczny: dobór liczby stołów dla prognozowanej liczby gości. */
export function generujBankietDlaGosci(liczbaGosci: number): ElementPlanuSali[] {
  const goscie = Math.max(8, Math.min(200, Math.trunc(liczbaGosci)));
  const potrzebneStoly = Math.max(1, Math.ceil(goscie / 8));
  const cols = potrzebneStoly <= 4 ? 2 : potrzebneStoly <= 8 ? 4 : 5;
  const rows = Math.ceil(potrzebneStoly / cols);
  const szer = 10;
  const wys = 7.5;
  const gx = 3.5;
  const gy = 3.2;
  const totalW = cols * szer + (cols - 1) * gx;
  const totalH = rows * wys + (rows - 1) * gy;
  const startX = Math.max(2, (100 - totalW) / 2);
  const startY = Math.max(4, (70 - totalH) / 2);
  const st: ElementPlanuSali[] = [];
  let n = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (n > potrzebneStoly) break;
      st.push(stolProst(startX + c * (szer + gx), startY + r * (wys + gy), szer, wys, String(n)));
      n += 1;
    }
  }
  return st;
}
