/**
 * Eksport grafiki pod social media (PNG) — html2canvas przez zależność html2pdf.js.
 */

export type FormatSocial = "post" | "story";

export const WYMIARY_SOCIAL: Record<FormatSocial, { szer: number; wys: number; etykieta: string }> = {
  post: { szer: 1080, wys: 1080, etykieta: "Post kwadrat (1080×1080)" },
  story: { szer: 1080, wys: 1920, etykieta: "Story pion (1080×1920)" },
};

function czekajNaMalowanie(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function bezpiecznaNazwaPlikuPng(nazwa: string, format: FormatSocial): string {
  const trimmed = (nazwa || "grafika").trim() || "grafika";
  const bez = trimmed.replace(/[<>:"/\\|?*\u0000-\u001f]+/g, "_").replace(/\s+/g, "_");
  const base = bez.slice(0, 80).replace(/_+/g, "_").replace(/^_|_$/g, "") || "grafika";
  const sufiks = format === "story" ? "story" : "post";
  return base.toLowerCase().endsWith(".png") ? base : `${base}-${sufiks}.png`;
}

export async function pobierzPngZElementuHtml(
  zrodlo: HTMLElement,
  opcje: { nazwaPliku: string; format: FormatSocial },
): Promise<{ ok: true } | { ok: false; komunikat: string }> {
  if (typeof document === "undefined") {
    return { ok: false, komunikat: "Funkcja dostępna tylko w przeglądarce." };
  }

  const { szer, wys } = WYMIARY_SOCIAL[opcje.format];

  const klon = zrodlo.cloneNode(true) as HTMLElement;
  klon.querySelectorAll(".no-print").forEach((node) => {
    node.parentElement?.removeChild(node);
  });
  klon.removeAttribute("id");

  const wrap = document.createElement("div");
  wrap.setAttribute("data-naszawies-social-export", opcje.format);
  wrap.style.cssText = [
    "position:fixed",
    "left:0",
    "top:0",
    `width:${szer}px`,
    `height:${wys}px`,
    "z-index:2147483646",
    "background:#ffffff",
    "overflow:hidden",
    "pointer-events:none",
    "box-sizing:border-box",
    "display:flex",
    "align-items:center",
    "justify-content:center",
  ].join(";");

  klon.style.cssText = [
    "box-sizing:border-box",
    "overflow:visible",
    "max-width:100%",
    "max-height:100%",
    "transform-origin:center center",
    "-webkit-print-color-adjust:exact",
    "print-color-adjust:exact",
  ].join(";");

  wrap.appendChild(klon);
  document.body.appendChild(wrap);
  void wrap.offsetHeight;
  await czekajNaMalowanie();

  const rect = klon.getBoundingClientRect();
  const skala = Math.min(szer / Math.max(rect.width, 1), wys / Math.max(rect.height, 1), 1);
  if (skala < 1) {
    klon.style.transform = `scale(${skala})`;
  }

  try {
    const html2canvas = (await import("html2canvas")).default;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const scale = Math.min(2, Math.max(1, dpr));

    const canvas = await html2canvas(wrap, {
      scale,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: szer,
      height: wys,
      scrollX: 0,
      scrollY: 0,
      allowTaint: false,
    });

    const link = document.createElement("a");
    link.download = opcje.nazwaPliku;
    link.href = canvas.toDataURL("image/png", 0.92);
    link.click();

    return { ok: true };
  } catch (e) {
    const komunikat = e instanceof Error ? e.message : "Nie udało się utworzyć pliku PNG.";
    return { ok: false, komunikat };
  } finally {
    wrap.parentElement?.removeChild(wrap);
  }
}
