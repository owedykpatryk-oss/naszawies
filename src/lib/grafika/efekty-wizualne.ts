import type { CSSProperties } from "react";
import type { MotywGrafiki } from "./typy";

/** Kolor z przezroczystością — obsługuje #rgb i #rrggbb */
export function kolorAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function gradientNaglowka(motyw: MotywGrafiki, kat = 135): string {
  const a2 = motyw.akcent2 ?? motyw.akcent;
  return `linear-gradient(${kat}deg, ${motyw.akcent} 0%, ${a2} 42%, ${motyw.akcent} 78%, ${a2} 100%)`;
}

export function gradientTlaSubtelny(motyw: MotywGrafiki): string {
  return `linear-gradient(168deg, ${motyw.tlo} 0%, ${kolorAlpha(motyw.akcent, 0.06)} 45%, ${kolorAlpha(motyw.akcent2 ?? motyw.akcent, 0.04)} 72%, ${motyw.tlo} 100%)`;
}

export function gradientMesh(motyw: MotywGrafiki): string {
  const a = kolorAlpha(motyw.akcent, 0.35);
  const b = kolorAlpha(motyw.akcent2 ?? motyw.akcent, 0.25);
  return `radial-gradient(ellipse 80% 60% at 15% 20%, ${a} 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 85% 75%, ${b} 0%, transparent 50%), radial-gradient(ellipse 50% 40% at 50% 100%, ${kolorAlpha(motyw.akcent, 0.12)} 0%, transparent 60%)`;
}

export function cienGlow(akcent: string, rozmiar = 24, alpha = 0.35): string {
  return `0 ${Math.round(rozmiar * 0.25)}px ${rozmiar}px ${kolorAlpha(akcent, alpha)}`;
}

export function wzorKropek(kolor = "#fff", rozmiar = 22): CSSProperties {
  return {
    backgroundImage: `radial-gradient(circle, ${kolor} 1.2px, transparent 1.2px)`,
    backgroundSize: `${rozmiar}px ${rozmiar}px`,
  };
}

export function wzorPromieni(kolor: string): CSSProperties {
  return {
    backgroundImage: `repeating-conic-gradient(from 0deg at 50% 50%, ${kolorAlpha(kolor, 0.08)} 0deg 8deg, transparent 8deg 18deg)`,
  };
}

export function cienTekstuGlow(akcent: string): string {
  return `0 2px 12px ${kolorAlpha(akcent, 0.45)}, 0 1px 0 rgba(0,0,0,0.15)`;
}
